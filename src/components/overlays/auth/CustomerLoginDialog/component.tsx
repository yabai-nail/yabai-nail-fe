import {
  ArrowLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import type { FormEvent } from "react";

/** Which half of the OTP flow the dialog is showing. */
export type CustomerLoginStep = "phone" | "otp";

/** Resolved copy and state drawn by the customer sign-in dialog. */
export type CustomerLoginDialogData = {
  readonly isOpen: boolean;
  readonly step: CustomerLoginStep;
  readonly phone: string;
  /** Backend-masked phone (`09***78`), shown once the OTP has been sent. */
  readonly maskedPhone: string;
  readonly code: string;
  readonly isSubmitting: boolean;
  readonly error: string | null;
  /** Seconds left before a resend is allowed; 0 means "resend now". */
  readonly resendSeconds: number;
};

/** Events reported by the dialog's controls. */
export type CustomerLoginDialogActions = {
  readonly setOpen: (isOpen: boolean) => void;
  readonly changePhone: (phone: string) => void;
  readonly changeCode: (code: string) => void;
  readonly submitPhone: (event: FormEvent<HTMLFormElement>) => void;
  readonly submitCode: (event: FormEvent<HTMLFormElement>) => void;
  readonly resend: () => void;
  readonly backToPhone: () => void;
};

export type CustomerLoginDialogProps = {
  readonly props: CustomerLoginDialogData;
  readonly on: CustomerLoginDialogActions;
};

const PHONE_ID = "customer-login-phone";
const CODE_ID = "customer-login-code";
const ERROR_ID = "customer-login-error";

const FIELD_CLASS =
  "min-h-11 w-full rounded-lg border border-border bg-field-background px-10 text-sm text-field-foreground outline-none transition-colors placeholder:text-field-placeholder focus:border-accent focus:ring-2 focus:ring-focus/20 disabled:cursor-wait disabled:opacity-60";

/** `0:45` — short enough to read at a glance on the resend button. */
const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Draw the OTP sign-in dialog without owning any of its state. */
export const _CustomerLoginDialog = ({ props, on }: CustomerLoginDialogProps) => (
  <Modal isOpen={props.isOpen} onOpenChange={on.setOpen}>
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
                {props.step === "phone" ? "Đăng nhập" : "Nhập mã xác thực"}
              </Modal.Heading>
              <p className="mt-1 text-sm leading-6 text-muted">
                {props.step === "phone"
                  ? "Nhập số điện thoại, YABAI sẽ gửi cho bạn một mã OTP."
                  : `Mã gồm 6 chữ số đã gửi tới ${props.maskedPhone || "số điện thoại của bạn"}.`}
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="px-6 py-5">
            {props.step === "phone" ? (
              <form
                className="space-y-4"
                onSubmit={on.submitPhone}
                aria-busy={props.isSubmitting}
              >
                <div>
                  <label
                    htmlFor={PHONE_ID}
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <PhoneIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id={PHONE_ID}
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={props.phone}
                      onChange={(event) => on.changePhone(event.target.value)}
                      placeholder="0912 345 678"
                      disabled={props.isSubmitting}
                      aria-describedby={props.error ? ERROR_ID : undefined}
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                {props.error ? (
                  <p
                    id={ERROR_ID}
                    role="alert"
                    className="rounded-lg bg-danger/10 px-3 py-2 text-xs leading-5 text-danger"
                  >
                    {props.error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isDisabled={props.isSubmitting}
                  className="rounded-lg"
                >
                  {props.isSubmitting ? "Đang gửi mã..." : "Gửi mã OTP"}
                </Button>
              </form>
            ) : (
              <form
                className="space-y-4"
                onSubmit={on.submitCode}
                aria-busy={props.isSubmitting}
              >
                <div>
                  <label
                    htmlFor={CODE_ID}
                    className="mb-2 block text-sm font-semibold text-foreground"
                  >
                    Mã OTP
                  </label>
                  <div className="relative">
                    <ChatBubbleBottomCenterTextIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                    />
                    <input
                      id={CODE_ID}
                      name="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      value={props.code}
                      onChange={(event) => on.changeCode(event.target.value)}
                      placeholder="123456"
                      disabled={props.isSubmitting}
                      aria-describedby={props.error ? ERROR_ID : undefined}
                      className={`${FIELD_CLASS} tracking-[0.4em]`}
                    />
                  </div>
                </div>

                {props.error ? (
                  <p
                    id={ERROR_ID}
                    role="alert"
                    className="rounded-lg bg-danger/10 px-3 py-2 text-xs leading-5 text-danger"
                  >
                    {props.error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isDisabled={props.isSubmitting || props.code.length < 6}
                  className="rounded-lg"
                >
                  {props.isSubmitting ? "Đang xác thực..." : "Xác nhận"}
                </Button>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={on.backToPhone}
                    disabled={props.isSubmitting}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg text-xs font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
                  >
                    <ArrowLeftIcon aria-hidden="true" className="size-4" />
                    Đổi số điện thoại
                  </button>

                  <button
                    type="button"
                    onClick={on.resend}
                    disabled={props.isSubmitting || props.resendSeconds > 0}
                    aria-live="polite"
                    className="min-h-11 rounded-lg px-1 text-xs font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-muted"
                  >
                    {props.resendSeconds > 0
                      ? `Gửi lại sau ${formatCountdown(props.resendSeconds)}`
                      : "Gửi lại mã"}
                  </button>
                </div>
              </form>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);

/** Source-level tier marker for the pure sign-in dialog. */
export const meta = { world: "pure", domain: "auth" } as const;
