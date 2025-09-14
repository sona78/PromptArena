import { SignUpForm } from "@/components/sign-up-form";
import { JapandiLayout } from "@/components/japandi-layout";

export default function Page() {
  return (
    <JapandiLayout 
      title="Create Account" 
      subtitle="Create your account to start using PromptArena."
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
