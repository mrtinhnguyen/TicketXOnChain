// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  trimStringProperties,
  validateId,
  generateIdString
} from '../../utils/helpers.js'

describe('Testing helper functions', () => {
  it('test trimStringProperties object', () => {
    const object = {
      name: ' Adam  ',
      surname: ' Smith',
      age: 35,
      hobbies: ['drawing ', '  sudoku', ' coding ', '   learn a language '],
      car: {
        brand: ' BMW',
        color: 'red ',
        year: 2007
      },
      pets: [
        {
          type: '  cat',
          name: '   Cleo '
        },
        {
          type: ' hamster',
          name: 'Biscuit '
        }
      ]
    }

    const expectedObject = {
      name: 'Adam',
      surname: 'Smith',
      age: 35,
      hobbies: ['drawing', 'sudoku', 'coding', 'learn a language'],
      car: {
        brand: 'BMW',
        color: 'red',
        year: 2007
      },
      pets: [
        {
          type: 'cat',
          name: 'Cleo'
        },
        {
          type: 'hamster',
          name: 'Biscuit'
        }
      ]
    }

    trimStringProperties(object)

    expect(object).toEqual(expectedObject)
  })

  it('test trimStringProperties null', () => {
    const object = null

    trimStringProperties(object)

    expect(object).toBeNull()
  })

  it('test validateId valid ids', () => {
    const validIds = [-121, -1, 0, 121, 12321]

    for (const id of validIds) {
      expect(validateId(id)).toBeTruthy()
    }
  })

  it('test validateId invalid ids', () => {
    const invalidIds = ['', '3', null, undefined, {}, []]

    for (const invalidId of invalidIds) {
      expect(validateId(invalidId)).toBeFalsy()
    }
  })

  it('test generateIdString values', () => {
    const values = [
      {
        name: 'Test event',
        id: 0,
        expectedString: 'test-event-0'
      },
      {
        name: 'Przykładowe wydarzenie "Święto miasta Katowice" !@#$%^&*()/\\',
        id: 121,
        expectedString:
          'przyk%C5%82adowe-wydarzenie-%22%C5%9Bwi%C4%99to-miasta-katowice%22-!%40%23%24%25%5E%26*()%2F%5C-121'
      },
      {
        name: '',
        id: 12321,
        expectedString: '-12321'
      }
    ]

    for (const value of values) {
      expect(generateIdString(value.name, value.id)).toBe(value.expectedString)
    }
  })
})
