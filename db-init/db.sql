-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema event_ticketing_app
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema event_ticketing_app
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `event_ticketing_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci ;
USE `event_ticketing_app` ;

-- -----------------------------------------------------
-- Table `event_ticketing_app`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`user` (
  `id_user` INT NOT NULL AUTO_INCREMENT,
  `public_address` CHAR(42) NOT NULL,
  `nonce` CHAR(17) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `username` VARCHAR(85) NOT NULL,
  `name` VARCHAR(85) NOT NULL,
  `surname` VARCHAR(85) NOT NULL,
  `birthdate` DATE NOT NULL,
  `role` ENUM('USER','EVENTS_ORGANIZER','ADMINISTRATOR') NOT NULL DEFAULT 'USER',
  `active` TINYINT NOT NULL DEFAULT 0,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  UNIQUE INDEX `public_address_UNIQUE` (`public_address` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`category` (
  `id_category` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(85) NOT NULL,
  PRIMARY KEY (`id_category`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`subcategory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`subcategory` (
  `id_subcategory` INT NOT NULL AUTO_INCREMENT,
  `id_category` INT NOT NULL,
  `name` VARCHAR(85) NOT NULL,
  PRIMARY KEY (`id_subcategory`),
  INDEX `fk_subcategory_category_idx` (`id_category` ASC),
  UNIQUE INDEX `id_category_name_UNIQUE` (`name` ASC, `id_category` ASC),
  CONSTRAINT `fk_subcategory_category`
    FOREIGN KEY (`id_category`)
    REFERENCES `event_ticketing_app`.`category` (`id_category`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`city`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`city` (
  `id_city` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(85) NOT NULL,
  `coordinates` POINT NOT NULL,
  PRIMARY KEY (`id_city`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC),
  SPATIAL INDEX `coordinates_SPATIAL` (`coordinates`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`upload`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`upload` (
  `id_upload` INT NOT NULL AUTO_INCREMENT,
  `url` VARCHAR(255) NOT NULL,
  `type` ENUM('FILE', 'IMAGE') NOT NULL,
  PRIMARY KEY (`id_upload`),
  UNIQUE INDEX `url_UNIQUE` (`url` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`event`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`event` (
  `id_event` INT NOT NULL AUTO_INCREMENT,
  `creator_id_user` INT NOT NULL,
  `id_subcategory` INT NOT NULL,
  `id_city` INT NOT NULL,
  `statute_id_upload` INT NULL,
  `nft_image_id_upload` INT NULL,
  `name` VARCHAR(120) NOT NULL,
  `tags` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `contract_address` CHAR(42) NULL,
  `video` VARCHAR(255) NULL,
  `ticket_price` DECIMAL(30,2) NOT NULL,
  `ticket_count` INT NOT NULL,
  `max_tickets_per_user` INT NOT NULL,
  `location` VARCHAR(120) NOT NULL,
  `street` VARCHAR(85) NOT NULL,
  `postal_code` CHAR(6) NOT NULL,
  `start` DATETIME NOT NULL,
  `publish` DATETIME NOT NULL,
  `draft` TINYINT NOT NULL DEFAULT 1,
  `likes` INT NOT NULL DEFAULT 0,
  `transferable` TINYINT NOT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_event`),
  INDEX `fk_event_subcategory1_idx` (`id_subcategory` ASC),
  INDEX `fk_event_city1_idx` (`id_city` ASC),
  INDEX `fk_event_user1_idx` (`creator_id_user` ASC),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC),
  FULLTEXT INDEX `name_tags_description_FULLTEXT` (`name`, `tags`, `description`),
  INDEX `fk_event_upload1_idx` (`statute_id_upload` ASC),
  INDEX `fk_event_upload2_idx` (`nft_image_id_upload` ASC),
  CONSTRAINT `fk_event_subcategory1`
    FOREIGN KEY (`id_subcategory`)
    REFERENCES `event_ticketing_app`.`subcategory` (`id_subcategory`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_event_city1`
    FOREIGN KEY (`id_city`)
    REFERENCES `event_ticketing_app`.`city` (`id_city`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_event_user1`
    FOREIGN KEY (`creator_id_user`)
    REFERENCES `event_ticketing_app`.`user` (`id_user`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_event_upload1`
    FOREIGN KEY (`statute_id_upload`)
    REFERENCES `event_ticketing_app`.`upload` (`id_upload`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_event_upload2`
    FOREIGN KEY (`nft_image_id_upload`)
    REFERENCES `event_ticketing_app`.`upload` (`id_upload`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`artist`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`artist` (
  `id_artist` INT NOT NULL AUTO_INCREMENT,
  `picture_id_upload` INT NOT NULL,
  `name` VARCHAR(85) NOT NULL,
  `description` TEXT NOT NULL,
  PRIMARY KEY (`id_artist`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC),
  INDEX `fk_artist_upload1_idx` (`picture_id_upload` ASC),
  CONSTRAINT `fk_artist_upload1`
    FOREIGN KEY (`picture_id_upload`)
    REFERENCES `event_ticketing_app`.`upload` (`id_upload`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`event_has_artist`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`event_has_artist` (
  `id_event` INT NOT NULL,
  `id_artist` INT NOT NULL,
  PRIMARY KEY (`id_event`, `id_artist`),
  INDEX `fk_event_has_artist_artist1_idx` (`id_artist` ASC),
  INDEX `fk_event_has_artist_event1_idx` (`id_event` ASC),
  UNIQUE INDEX `id_event_id_artist_UNIQUE` (`id_event` ASC, `id_artist` ASC),
  CONSTRAINT `fk_event_has_artist_event1`
    FOREIGN KEY (`id_event`)
    REFERENCES `event_ticketing_app`.`event` (`id_event`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_event_has_artist_artist1`
    FOREIGN KEY (`id_artist`)
    REFERENCES `event_ticketing_app`.`artist` (`id_artist`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`event_has_upload`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`event_has_upload` (
  `id_event` INT NOT NULL,
  `id_upload` INT NOT NULL,
  PRIMARY KEY (`id_event`, `id_upload`),
  INDEX `fk_event_has_upload_upload1_idx` (`id_upload` ASC),
  INDEX `fk_event_has_upload_event1_idx` (`id_event` ASC),
  UNIQUE INDEX `id_event_id_upload_UNIQUE` (`id_event` ASC, `id_upload` ASC),
  CONSTRAINT `fk_event_has_upload_event1`
    FOREIGN KEY (`id_event`)
    REFERENCES `event_ticketing_app`.`event` (`id_event`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_event_has_upload_upload1`
    FOREIGN KEY (`id_upload`)
    REFERENCES `event_ticketing_app`.`upload` (`id_upload`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`review`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`review` (
  `id_review` INT NOT NULL AUTO_INCREMENT,
  `reviewer_id_user` INT NOT NULL,
  `reviewed_id_artist` INT NOT NULL,
  `title` VARCHAR(85) NOT NULL,
  `event_location` VARCHAR(120) NOT NULL,
  `event_date` DATE NOT NULL,
  `content` TEXT NOT NULL,
  `rate` TINYINT NOT NULL,
  `approved` TINYINT NOT NULL DEFAULT 0,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_review`),
  INDEX `fk_review_user1_idx` (`reviewer_id_user` ASC),
  INDEX `fk_review_artist1_idx` (`reviewed_id_artist` ASC),
  CONSTRAINT `fk_review_user1`
    FOREIGN KEY (`reviewer_id_user`)
    REFERENCES `event_ticketing_app`.`user` (`id_user`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_review_artist1`
    FOREIGN KEY (`reviewed_id_artist`)
    REFERENCES `event_ticketing_app`.`artist` (`id_artist`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`user_follow_artist`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`user_follow_artist` (
  `id_user` INT NOT NULL,
  `id_artist` INT NOT NULL,
  PRIMARY KEY (`id_user`, `id_artist`),
  INDEX `fk_user_has_artist_artist1_idx` (`id_artist` ASC),
  INDEX `fk_user_has_artist_user1_idx` (`id_user` ASC),
  UNIQUE INDEX `id_user_id_artist_UNIQUE` (`id_user` ASC, `id_artist` ASC),
  CONSTRAINT `fk_user_has_artist_user1`
    FOREIGN KEY (`id_user`)
    REFERENCES `event_ticketing_app`.`user` (`id_user`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_user_has_artist_artist1`
    FOREIGN KEY (`id_artist`)
    REFERENCES `event_ticketing_app`.`artist` (`id_artist`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`ticket`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`ticket` (
  `id_ticket` INT NOT NULL AUTO_INCREMENT,
  `ticket_address` CHAR(42) NOT NULL,
  `user_address` CHAR(42) NOT NULL,
  `token_id` INT UNSIGNED NOT NULL,
  `price` DECIMAL(30,2) NOT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_ticket`),
  INDEX `user_address_idx` (`user_address` ASC),
  INDEX `ticket_address_idx` (`ticket_address` ASC),
  UNIQUE INDEX `ticket_address_UNIQUE` (`ticket_address` ASC, `token_id` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `event_ticketing_app`.`configuration`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`configuration` (
  `id_configuration` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(85) NOT NULL,
  `value` TEXT NOT NULL,
  PRIMARY KEY (`id_configuration`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC))
ENGINE = InnoDB;

USE `event_ticketing_app` ;

-- -----------------------------------------------------
-- Placeholder table for view `event_ticketing_app`.`daily_income`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`daily_income` (`id_event` INT, `'creator_id_user'` INT, `'date'` INT, `'income'` INT, `'ticket_count'` INT);

-- -----------------------------------------------------
-- Placeholder table for view `event_ticketing_app`.`monthly_income`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`monthly_income` (`id_event` INT, `'creator_id_user'` INT, `'date'` INT, `'income'` INT, `'ticket_count'` INT);

-- -----------------------------------------------------
-- Placeholder table for view `event_ticketing_app`.`annual_income`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`annual_income` (`id_event` INT, `'creator_id_user'` INT, `'date'` INT, `'income'` INT, `'ticket_count'` INT);

-- -----------------------------------------------------
-- Placeholder table for view `event_ticketing_app`.`ticket_count_by_category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`ticket_count_by_category` (`creator_id_user` INT, `id_category` INT, `'category_name'` INT, `'ticket_count'` INT);

-- -----------------------------------------------------
-- Placeholder table for view `event_ticketing_app`.`ticket_list`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_ticketing_app`.`ticket_list` (`id_user` INT, `email` INT, `username` INT, `id_event` INT, `creator_id_user` INT, `'event_name'` INT, `id_ticket` INT, `ticket_address` INT, `user_address` INT, `token_id` INT, `'ticket_price'` INT, `'ticket_used'` INT, `created` INT);

-- -----------------------------------------------------
-- function get_cities_in_area
-- -----------------------------------------------------

DELIMITER $$
USE `event_ticketing_app`$$
CREATE FUNCTION get_cities_in_area(city_id INT, distance SMALLINT UNSIGNED)
RETURNS TEXT
READS SQL DATA
COMMENT 'Get ids of cities in given distance (meters) of particular city'
BEGIN
	Declare city_coordinates POINT;
    Declare ids_cities TEXT;
	Declare EXIT HANDLER FOR NOT FOUND RETURN NULL;
    
    SELECT coordinates INTO city_coordinates
		FROM city
		WHERE id_city = city_id;
    
    SELECT GROUP_CONCAT(id_city) INTO ids_cities
		FROM city
        WHERE ST_distance_sphere(coordinates, city_coordinates) <= distance;
	
    return ids_cities;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- View `event_ticketing_app`.`daily_income`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `event_ticketing_app`.`daily_income`;
USE `event_ticketing_app`;
CREATE  OR REPLACE VIEW `daily_income` AS
SELECT e.id_event, MAX(e.creator_id_user) 'creator_id_user', DATE(t.created) 'date', SUM(t.price) 'income', COUNT(t.id_ticket) 'ticket_count'
FROM `ticket` t
JOIN `event` e ON e.contract_address = t.ticket_address
GROUP BY e.id_event, date;

-- -----------------------------------------------------
-- View `event_ticketing_app`.`monthly_income`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `event_ticketing_app`.`monthly_income`;
USE `event_ticketing_app`;
CREATE  OR REPLACE VIEW `monthly_income` AS
SELECT e.id_event, MAX(e.creator_id_user) 'creator_id_user', DATE_FORMAT(t.created, '%Y-%m') 'date', SUM(t.price) 'income', COUNT(t.id_ticket) 'ticket_count'
FROM `ticket` t
JOIN `event` e ON e.contract_address = t.ticket_address
GROUP BY e.id_event, date;

-- -----------------------------------------------------
-- View `event_ticketing_app`.`annual_income`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `event_ticketing_app`.`annual_income`;
USE `event_ticketing_app`;
CREATE  OR REPLACE VIEW `annual_income` AS
SELECT e.id_event, MAX(e.creator_id_user) 'creator_id_user', YEAR(t.created) 'date', SUM(t.price) 'income', COUNT(t.id_ticket) 'ticket_count'
FROM `ticket` t
JOIN `event` e ON e.contract_address = t.ticket_address
GROUP BY e.id_event, date;

-- -----------------------------------------------------
-- View `event_ticketing_app`.`ticket_count_by_category`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `event_ticketing_app`.`ticket_count_by_category`;
USE `event_ticketing_app`;
CREATE  OR REPLACE VIEW `ticket_count_by_category` AS
SELECT e.creator_id_user, id_category, MAX(c.name) 'category_name', COUNT(t.id_ticket) 'ticket_count'
FROM `ticket` t
JOIN `event` e ON e.contract_address = t.ticket_address
JOIN `subcategory` s USING(id_subcategory)
JOIN `category` c USING(id_category)
GROUP BY e.creator_id_user, id_category WITH ROLLUP;

-- -----------------------------------------------------
-- View `event_ticketing_app`.`ticket_list`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `event_ticketing_app`.`ticket_list`;
USE `event_ticketing_app`;
CREATE  OR REPLACE VIEW `ticket_list` AS
SELECT
	u.id_user, u.email, u.username, e.id_event, e.creator_id_user, e.name 'event_name', t.id_ticket, t.ticket_address, t.user_address, t.token_id, t.price 'ticket_price', t.used 'ticket_used', t.created
FROM `ticket` t
LEFT JOIN `user` u ON u.public_address = t.user_address
JOIN `event` e ON e.contract_address = t.ticket_address
ORDER BY t.created DESC;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `event_ticketing_app`.`category`
-- -----------------------------------------------------
START TRANSACTION;
USE `event_ticketing_app`;
INSERT INTO `event_ticketing_app`.`category` (`id_category`, `name`) VALUES (1, 'Muzyka');
INSERT INTO `event_ticketing_app`.`category` (`id_category`, `name`) VALUES (2, 'Sport');
INSERT INTO `event_ticketing_app`.`category` (`id_category`, `name`) VALUES (3, 'Widowisko');
INSERT INTO `event_ticketing_app`.`category` (`id_category`, `name`) VALUES (4, 'Teatr');
INSERT INTO `event_ticketing_app`.`category` (`id_category`, `name`) VALUES (5, 'Wystawy');

COMMIT;


-- -----------------------------------------------------
-- Data for table `event_ticketing_app`.`subcategory`
-- -----------------------------------------------------
START TRANSACTION;
USE `event_ticketing_app`;
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (1, 1, 'Disco Polo');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (2, 1, 'Klasyczna');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (3, 1, 'Metal');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (4, 1, 'Pop');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (5, 1, 'Rap');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (6, 1, 'Techno');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (7, 1, 'Trance');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (8, 2, 'Koszykówka');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (9, 2, 'Lekkoatletyka');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (10, 2, 'Piłka nożna');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (11, 2, 'Żużel');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (12, 3, 'Kabaret');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (13, 3, 'Kino');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (14, 3, 'Show');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (15, 3, 'Stand-up');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (16, 4, 'Komedia');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (17, 4, 'Musical');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (18, 4, 'Opera');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (19, 4, 'Tragedia');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (20, 5, 'Muzeum');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (21, 5, 'Targi');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (22, 1, 'Inne');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (23, 2, 'Inne');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (24, 3, 'Inne');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (25, 4, 'Inne');
INSERT INTO `event_ticketing_app`.`subcategory` (`id_subcategory`, `id_category`, `name`) VALUES (26, 5, 'Inne');

COMMIT;


-- -----------------------------------------------------
-- Data for table `event_ticketing_app`.`city`
-- -----------------------------------------------------
START TRANSACTION;
USE `event_ticketing_app`;
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (1, 'Warszawa', POINT(20.896045,52.233033));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (2, 'Białystok', POINT(23.073494,53.1276997));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (3, 'Gdańsk', POINT(18.5248786,54.3611747));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (4, 'Bydgoszcz', POINT(17.8730335,53.1257789));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (5, 'Szczecin', POINT(14.4594748,53.4297869));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (6, 'Poznań', POINT(16.7365168,52.400623));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (7, 'Łódź', POINT(19.3154434,51.7732147));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (8, 'Wrocław', POINT(16.909292,51.1271566));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (9, 'Częstochowa', POINT(19.0401992,50.8094));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (10, 'Katowice', POINT(18.9246207,50.213753));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (11, 'Kraków', POINT(19.8397235,50.046869));
INSERT INTO `event_ticketing_app`.`city` (`id_city`, `name`, `coordinates`) VALUES (12, 'Lublin', POINT(22.4811983,51.2181875));

COMMIT;


-- -----------------------------------------------------
-- Data for table `event_ticketing_app`.`configuration`
-- -----------------------------------------------------
START TRANSACTION;
USE `event_ticketing_app`;
INSERT INTO `event_ticketing_app`.`configuration` (`id_configuration`, `name`, `value`) VALUES (1, 'lastSyncedBlock', ' ');

COMMIT;

