import { Suspense } from "react";
import { VerificationEmailView } from "./VerificationEmailView";

export default function VerificationEmailPage() {
  return (
    <Suspense>
      <VerificationEmailView />
    </Suspense>
  );
}
