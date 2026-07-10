import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (formData) => {
    try {
      await login(formData.email, formData.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-primary">SyncSpace Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-lg px-3 py-2"
          {...register("email", { required: true })}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-3 py-2"
          {...register("password", { required: true })}
        />
        <button type="submit" className="w-full bg-primary text-white rounded-lg py-2 hover:bg-primary-dark">
          Log In
        </button>
        <p className="text-sm text-center">
          No account? <Link to="/register" className="text-primary">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
