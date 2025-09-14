import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-section-header text-[#28282D]">
                SORRY, SOMETHING WENT WRONG.
              </CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-serif-sm text-[#79797C]">
                  Code error: {params.error}
                </p>
              ) : (
                <p className="text-serif-sm text-[#79797C]">
                  An unspecified error occurred.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
