import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Main from "~/components/Main"
import ProtectedRoute from "~/components/ProtectedRoute"
import RoleRoute from "~/components/RoleRoute"
import ScrollToTop from "~/components/ScrollToTop"
import PageTitle from "~/components/PageTitle"
import ProfileMenu from "~/components/ProfileMenu"

import Index from "~/routes/Index"
import SignUp from "~/routes/SignUp"
import Artists from "~/routes/Artists"
import Artist from "~/routes/Artist"
import Event from "~/routes/Event"
import NotFound from "~/routes/NotFound"
import Swagger from "~/routes/Swagger"
import Activate from "~/routes/Activate"

import Profile from "~/routes/Profile"
import Tickets from "~/routes/Tickets"
import FollowedArtists from "~/routes/FollowedArtists"

import Events from "~/routes/Events"
import Sales from "~/routes/Sales"
import Report from "~/routes/Report"

import Users from "~/routes/Users"
import ManageArtists from "~/routes/ManageArtists"
import ReviewsToApprove from "~/routes/ReviewsToApprove"
import EventsToApprove from "~/routes/EventsToApprove"

function Router() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/swagger" element={<Swagger />} />
        <Route
          element={
            <>
              <PageTitle />
              <Main />
            </>
          }
        >
          <Route index element={<Index />} />
          <Route
            path="/artists"
            element={
              <>
                <PageTitle title="Artyści" />
                <Artists />
              </>
            }
          />
          <Route path="/artists/:id" element={<Artist />} />
          <Route path="/events" element={<Navigate to="/" replace />} />
          <Route path="/events/:id" element={<Event />} />
          <Route
            path="/sign-up"
            element={
              <>
                <PageTitle title="Zarejestruj się" />
                <SignUp />
              </>
            }
          />
          <Route path="/activate/:token" element={<Activate />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<ProfileMenu />}>
              <Route
                path="/profile"
                element={
                  <>
                    <PageTitle title="Profil" />
                    <Profile />
                  </>
                }
              />
              <Route
                path="/profile/tickets"
                element={
                  <>
                    <PageTitle title="Bilety" />
                    <Tickets />
                  </>
                }
              />
              <Route
                path="/profile/followed-artists"
                element={
                  <>
                    <PageTitle title="Obserwowani artyści" />
                    <FollowedArtists />
                  </>
                }
              />
              <Route element={<RoleRoute role="EVENTS_ORGANIZER" />}>
                <Route
                  path="/profile/events"
                  element={
                    <>
                      <PageTitle title="Wydarzenia" />
                      <Events />
                    </>
                  }
                />
                <Route
                  path="/profile/sales"
                  element={
                    <>
                      <PageTitle title="Sprzedaż" />
                      <Sales />
                    </>
                  }
                />
                <Route
                  path="/profile/report"
                  element={
                    <>
                      <PageTitle title="Raport" />
                      <Report />
                    </>
                  }
                />
              </Route>
              <Route element={<RoleRoute role="ADMINISTRATOR" />}>
                <Route
                  path="/profile/users"
                  element={
                    <>
                      <PageTitle title="Użytkownicy" />
                      <Users />
                    </>
                  }
                />
                <Route
                  path="/profile/artists"
                  element={
                    <>
                      <PageTitle title="Artyści" />
                      <ManageArtists />
                    </>
                  }
                />
                <Route
                  path="/profile/reviews-to-approve"
                  element={
                    <>
                      <PageTitle title="Recenzje do zatwierdzenia" />
                      <ReviewsToApprove />
                    </>
                  }
                />
                <Route
                  path="/profile/events-to-approve"
                  element={
                    <>
                      <PageTitle title="Wydarzenia do zatwierdzenia" />
                      <EventsToApprove />
                    </>
                  }
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
