import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const { register, handleSubmit } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (formData) => {
    try {
      await registerUser(formData.name, formData.email, formData.password);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90"
      >
        <h1 className="text-2xl font-semibold text-primary">Create Account</h1>
        <input
          type="text"
          placeholder="Full Name"
          className="input-field"
          {...register("name", { required: true })}
        />
        <input
          type="email"
          placeholder="Email"
          className="input-field"
          {...register("email", { required: true })}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          {...register("password", { required: true, minLength: 6 })}
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Sign Up
        </button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
