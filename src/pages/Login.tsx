import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate("/main")}>
      Dummy Login 
    </button>
  );
}
