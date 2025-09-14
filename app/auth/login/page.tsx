import { LoginForm } from "@/components/login-form";
import { JapandiLayout } from "@/components/japandi-layout";

export default function Page() {
  return (
    <JapandiLayout 
      title="Welcome Back" 
      subtitle="Enter your credentials to continue your journey with mindful prompting."
      showNav={false}
      maxWidth="sm"
    >
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </JapandiLayout>
  );
}
