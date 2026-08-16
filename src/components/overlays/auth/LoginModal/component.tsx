"use client";

import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState, type FormEvent } from "react";

export interface LoginModalProps {
  readonly triggerClassName: string;
  readonly onDismiss?: () => void;
}

const EMAIL_ID = "login-email";
const PASSWORD_ID = "login-password";

/** Draw the client login surface without persisting or transmitting credentials. */
export function LoginModal({
  triggerClassName,
  onDismiss,
}: LoginModalProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const dismiss = () => {
    setIsPasswordVisible(false);
    setStatusMessage("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(
      "Giao diện đã sẵn sàng. API xác thực sẽ được kết nối ở bước tiếp theo.",
    );
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
                  Chào mừng bạn trở lại
                </Modal.Heading>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Đăng nhập để quản lý lịch hẹn và trải nghiệm tại YABAI.
                </p>
              </div>
            </Modal.Header>

            <Modal.Body className="px-6 py-5">
              <form className="space-y-4" onSubmit={submit}>
                <div>
                  <label
                    htmlFor={EMAIL_ID}
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <EnvelopeIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id={EMAIL_ID}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="ban@example.com"
                      className="min-h-11 w-full rounded-lg border border-border bg-field-background px-10 text-sm text-field-foreground outline-none transition-colors placeholder:text-field-placeholder focus:border-accent focus:ring-2 focus:ring-focus/20"
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
                        setStatusMessage(
                          "Khôi phục mật khẩu sẽ được kết nối cùng API xác thực.",
                        )
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
                      className="min-h-11 w-full rounded-lg border border-border bg-field-background px-10 pr-12 text-sm text-field-foreground outline-none transition-colors placeholder:text-field-placeholder focus:border-accent focus:ring-2 focus:ring-focus/20"
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

                {statusMessage ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className="rounded-lg bg-accent-soft px-3 py-2 text-xs leading-5 text-accent-soft-foreground"
                  >
                    {statusMessage}
                  </p>
                ) : null}

                <Button type="submit" variant="primary" fullWidth className="rounded-lg">
                  Đăng nhập
                </Button>
              </form>
            </Modal.Body>

            <Modal.Footer className="justify-center border-t border-separator bg-surface-secondary px-6 py-4 text-sm text-muted">
              <span>Chưa có tài khoản?</span>
              <button
                type="button"
                onClick={() =>
                  setStatusMessage(
                    "Đăng ký tài khoản sẽ được bổ sung cùng luồng xác thực.",
                  )
                }
                className="min-h-11 rounded-lg px-2 font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Đăng ký
              </button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export const loginModalMeta = { world: "connected", domain: "auth" } as const;
