import { Suspense } from "react";
import { MotDePasseOublieForm } from "./MotDePasseOublieForm";

export default function MotDePasseOubliePage() {
  return (
    <Suspense>
      <MotDePasseOublieForm />
    </Suspense>
  );
}
