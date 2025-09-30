import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserStore } from "./store/use-user-store";
import { checkUserAuth } from "./services/user-services";
import Loader from "./utils/loader";
import UserLogin from "./pages/auth/login";

export const ProtectedRoute = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const { isAuthenticated, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await checkUserAuth();
        if (result?.isAuthenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error) {
        console.error(error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, [setUser, clearUser]);

  if (isChecking) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={<UserLogin />} state={{ from: location }} replace />;
  }

  //if user is authenticated then render the protected route
  return <Outlet />;
};

export const PublicRoute = () => {
  const { isAuthenticated } = useUserStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
