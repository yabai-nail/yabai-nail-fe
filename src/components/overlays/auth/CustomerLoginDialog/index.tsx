"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { ApiClientError, useCustomerAuth } from "@/service";
import {
  _CustomerLoginDialog,
  type CustomerLoginStep,
} from "./component";

export interface CustomerLoginDialogProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  /** Fired once the OTP has been accepted and the session adopted. */
  readonly onSignedIn?: () => void;
}

/** Seconds between now and an ISO instant, floored at 0. */
const secondsUntil = (isoInstant: string | undefined): number => {
  if (!isoInstant) return 0;
  const target = Date.parse(isoInstant);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
};

/** Vietnamese phrasing for the error codes this flow can actually produce. */
const messageFor = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    if (error.code === "PHONE_INVALID") {
      return "Số điện thoại không hợp lệ. Hãy nhập theo dạng 0912345678.";
    }
    if (error.code === "OTP_SEND_LIMIT_REACHED") {
      // The backend reports `retryAfterSeconds: 3600` on this code, but
      // `normalizeApiError` does not carry that field through, so the copy
      // states the window instead of counting it down.
      return "Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau khoảng một giờ.";
    }
    if (error.code === "NETWORK_ERROR") {
      return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
    }
    return error.message;
  }
  return "Không thể đăng nhập. Vui lòng thử lại.";
};

/**
 * Owns the two-step OTP state so `_CustomerLoginDialog` stays pure. The
 * challenge id lives in a ref-like state because a resend replaces it: verify
 * must always post to the newest challenge or the code the customer just
 * received is checked against a dead one.
 */
export const CustomerLoginDialog = ({
  isOpen,
  onOpenChange,
  onSignedIn,
}: CustomerLoginDialogProps) => {
  const { requestOtp, verifyOtp } = useCustomerAuth();
  const [step, setStep] = useState<CustomerLoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Seeded from the backend's `resendAllowedAt` when a challenge is created,
  // then counted down locally. The gate is advisory — the backend re-checks it
  // — so a second of clock drift costs nothing.
  const [resendSeconds, setResendSeconds] = useState(0);
  // Guards against a resend that resolves after the dialog was closed.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keyed on the boundary rather than on the value, so the interval is created
  // once per countdown instead of being torn down and rebuilt every tick.
  const isCountingDown = resendSeconds > 0;
  useEffect(() => {
    if (!isCountingDown) return;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCountingDown]);

  const reset = useCallback(() => {
    setStep("phone");
    setPhone("");
    setMaskedPhone("");
    setChallengeId(null);
    setCode("");
    setError(null);
    setResendSeconds(0);
    setIsSubmitting(false);
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset],
  );

  const sendChallenge = useCallback(
    async (targetPhone: string) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const challenge = await requestOtp(targetPhone);
        if (!isMountedRef.current) return;
        setChallengeId(challenge.challengeId);
        setMaskedPhone(challenge.maskedPhone);
        setResendSeconds(secondsUntil(challenge.resendAllowedAt));
        setCode("");
        setStep("otp");
      } catch (caught) {
        if (isMountedRef.current) setError(messageFor(caught));
      } finally {
        if (isMountedRef.current) setIsSubmitting(false);
      }
    },
    [requestOtp],
  );

  const submitPhone = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendChallenge(phone);
    },
    [phone, sendChallenge],
  );

  const resend = useCallback(() => {
    void sendChallenge(phone);
  }, [phone, sendChallenge]);

  const submitCode = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!challengeId) return;
      setError(null);
      setIsSubmitting(true);
      void (async () => {
        try {
          await verifyOtp(challengeId, code);
          if (!isMountedRef.current) return;
          reset();
          onOpenChange(false);
          onSignedIn?.();
        } catch (caught) {
          if (isMountedRef.current) setError(messageFor(caught));
        } finally {
          if (isMountedRef.current) setIsSubmitting(false);
        }
      })();
    },
    [challengeId, code, onOpenChange, onSignedIn, reset, verifyOtp],
  );

  const backToPhone = useCallback(() => {
    setStep("phone");
    setCode("");
    setError(null);
  }, []);

  return (
    <_CustomerLoginDialog
      props={{
        isOpen,
        step,
        phone,
        maskedPhone,
        code,
        isSubmitting,
        error,
        resendSeconds,
      }}
      on={{
        setOpen,
        changePhone: setPhone,
        // The backend only ever issues 6 digits; dropping everything else keeps
        // a pasted "Ma OTP: 123456" from being posted verbatim.
        changeCode: (next) => setCode(next.replace(/\D/g, "").slice(0, 6)),
        submitPhone,
        submitCode,
        resend,
        backToPhone,
      }}
    />
  );
};

/** Source-level tier marker for the connected sign-in dialog. */
export const meta = { world: "connected", domain: "auth" } as const;
