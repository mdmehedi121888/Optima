import { LockKeyhole, User, Eye, EyeOff, LogIn } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Bounce, toast } from "react-toastify";
import Swal from "sweetalert2";

interface LoginFormInputs {
  userId: string;
  password: string;
}

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensures cookies are stored
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
       
        toast.success('Login Successful!', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
          });
          navigate("/");
      } else {
        toast.error('Login Failed!', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
          });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire("Error", "Something went wrong!", "error");

    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600">
      <div className="bg-white shadow-xl rounded-2xl px-10 py-12 w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          optimaX
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User ID Field */}
          <div className="relative">
            <User className="absolute left-4 top-3 text-purple-500" size={20} />
            <input
              className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-100 shadow-inner text-gray-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
              type="text"
              placeholder="Enter your User ID"
              {...register("userId", { required: "User ID is required" })}
            />
            {errors.userId && <p className="text-red-500 text-sm">{errors.userId.message}</p>}
          </div>

          {/* Password Field */}
          <div className="relative">
            <LockKeyhole className="absolute left-4 top-3 text-purple-500" size={20} />
            <input
              className="w-full pl-12 pr-12 py-3 rounded-full bg-gray-100 shadow-inner text-gray-700 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3 text-purple-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 
  flex items-center justify-center gap-x-2"
  type="submit"
>
  LOG IN <LogIn className="w-5 h-5" />
</button>

        </form>
      </div>
    </div>
  );
};

export default LoginForm;
