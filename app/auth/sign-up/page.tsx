import { SignUpForm } from "@/components/sign-up-form";
import { JapandiLayout } from "@/components/japandi-layout";

export default function Page() {
  return (
    <JapandiLayout 
      title="Begin Your Journey" 
      subtitle="Create your account and start exploring the art of thoughtful prompting."
      showNav={false}
      maxWidth="sm"
    >
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </div>
    </JapandiLayout>
  );
}
