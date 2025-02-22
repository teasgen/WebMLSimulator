import { useNavigate } from "react-router";

export const useNavigateToMenu = () => {
  const navigate = useNavigate();
  return () => navigate("/menu");
};
