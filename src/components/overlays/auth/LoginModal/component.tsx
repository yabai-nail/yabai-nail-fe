"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiClientError, useAuth } from "@/service";

export interface LoginModalProps {
  readonly triggerClassName: string;
  readonly onDismiss?: () => void;
}

const PHONE_ID = "login-phone";
const PASSWORD_ID = "login-password";
const FEEDBACK_ID = "login-feedback";

interface Feedback {
  readonly kind: "error" | "info";
  readonly message: string;
}

export function LoginModal({
  triggerClassName,
  onDismiss,
}: LoginModalProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const dismiss = () => {
    setIsPasswordVisible(false);
    setFeedback(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "");
    const password = String(form.get("password") ?? "");

    setFeedback(null);
    setIsSubmitting(true);
    try {
      await login({ phone, password });
      router.push("/admin");
    } catch (error) {
      const message =
        error instanceof ApiClientError && error.code === "INVALID_CREDENTIALS"
          ? "Số điện thoại hoặc mật khẩu không đúng."
          : error instanceof ApiClientError
            ? error.message
            : "Không thể đăng nhập. Vui lòng thử lại.";
      setFeedback({ kind: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onOpenChange={(open) => {
        if (!open) {
          dismiss();
          onDismiss?.();
        }
      }}
    >
      <Modal.Trigger className={triggerClassName}>
        <UserIcon aria-hidden="true" className="size-4" />
        Đăng nhập
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog className="overflow-hidden rounded-xl border border-border bg-surface shadow-atelier">
            <Modal.CloseTrigger className="rounded-lg text-muted" />

            <Modal.Header className="flex flex-col items-start gap-3 border-b border-separator px-6 pb-5 pt-6 pr-14">
              <span
                aria-hidden="true"
                className="font-display grid size-11 place-items-center rounded-lg bg-accent text-lg font-semibold text-accent-foreground"
              >
                Y
              </span>
              <div>
                <Modal.Heading className="text-xl font-bold text-foreground">
                  Đăng nhập quản trị
                </Modal.Heading>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Dành cho quản lý và chủ chuỗi YABAI.
                </p>
              </div>
            </Modal.Header>

            <Modal.Body className="px-6 py-5">
              <form className="space-y-4" onSubmit={submit} aria-busy={isSubmitting}>
                <div>
                  <label
                    htmlFor={PHONE_ID}
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Email hoặc số điện thoại
                  </label>
                  <div className="relative">
                    <PhoneIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id={PHONE_ID}
                      name="phone"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="Email hoặc số điện thoại"
                      disabled={isSubmitting}
                      aria-describedby={feedback ? FEEDBACK_ID : undefined}
                      className="min-h-11 w-full rounded-lg border border-border bg-field-background px-10 text-sm text-field-foreground outline-none transition-colors placeholder:text-field-placeholder focus:border-accent focus:ring-2 focus:ring-focus/20 disabled:cursor-wait disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor={PASSWORD_ID}
                      className="text-sm font-semibold text-foreground"
                    >
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFeedback({
                          kind: "info",
                          message: "Tính năng khôi phục mật khẩu chưa được hỗ trợ.",
                        })
                      }
                      className="min-h-11 rounded-lg px-2 text-xs font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <LockClosedIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id={PASSWORD_ID}
                      name="password"
                      type={isPasswordVisible ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="Nhập mật khẩu"
                      disabled={isSubmitting}
                      aria-describedby={feedback ? FEEDBACK_ID : undefined}
                      className="min-h-11 w-full rounded-lg border border-border bg-field-background px-10 pr-12 text-sm text-field-foreground outline-none transition-colors placeholder:text-field-placeholder focus:border-accent focus:ring-2 focus:ring-focus/20 disabled:cursor-wait disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((visible) => !visible)}
                      aria-label={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {isPasswordVisible ? (
                        <EyeSlashIcon aria-hidden="true" className="size-5" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-5" />
                      )}
                    </button>
                  </div>
                </div>

                {feedback ? (
                  <p
                    id={FEEDBACK_ID}
                    role={feedback.kind === "error" ? "alert" : "status"}
                    aria-live="polite"
                    className={
                      feedback.kind === "error"
                        ? "rounded-lg bg-danger/10 px-3 py-2 text-xs leading-5 text-danger"
                        : "rounded-lg bg-accent-soft px-3 py-2 text-xs leading-5 text-accent-soft-foreground"
                    }
                  >
                    {feedback.message}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isDisabled={isSubmitting}
                  className="rounded-lg"
                >
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            </Modal.Body>

            <Modal.Footer className="justify-center border-t border-separator bg-surface-secondary px-6 py-4 text-sm text-muted">
              <span>Chưa có tài khoản?</span>
              <button
                type="button"
                onClick={() =>
                  setFeedback({
                    kind: "info",
                    message: "Tài khoản quản trị được cấp bởi chủ hệ thống.",
                  })
                }
                className="min-h-11 rounded-lg px-2 font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Liên hệ quản trị
              </button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export const loginModalMeta = { world: "connected", domain: "auth" } as const;
