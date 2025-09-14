import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-section-header text-[#28282D]">
                THANK YOU FOR SIGNING UP!
              </CardTitle>
              <CardDescription className="text-serif text-[#79797C]">Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-serif-sm text-[#79797C]">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
