import { Suspense } from "react";
import { ReinitialisationForm } from "./ReinitialisationForm";

export default function ReinitialisationPage() {
  return (
    <Suspense>
      <ReinitialisationForm />
    </Suspense>
  );
}
