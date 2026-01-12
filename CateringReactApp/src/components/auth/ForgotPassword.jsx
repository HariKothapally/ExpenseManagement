import { useState } from "react";
import { FormField, LoadingButton } from "../common";
import { auth } from "../../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await auth.forgotPassword({ email });
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reset instructions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Reset Password
        </h2>
      </div>

      <FormField
        name="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Enter your email address"
      />

      <LoadingButton
        type="submit"
        loading={isLoading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
      >
        Send Reset Instructions
      </LoadingButton>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
}
