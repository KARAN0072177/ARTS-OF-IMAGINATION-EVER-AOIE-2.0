"use client";

import { useEffect } from "react";

interface VerificationCompleteSignalProps {
  email?: string;
}

export default function VerificationCompleteSignal({
  email = "",
}: VerificationCompleteSignalProps) {
  useEffect(() => {
    const payload = JSON.stringify({
      email,
      verifiedAt: Date.now(),
    });

    localStorage.setItem(
      "aoie-email-verified",
      payload
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "aoie-email-verified",
        newValue: payload,
      })
    );
  }, [email]);

  return null;
}
