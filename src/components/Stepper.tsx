import { Fragment } from "react";
import styles from "./Stepper.module.css";
import { CheckIcon } from "./icons";

interface StepBadgeProps {
  step: number;
  current: number;
  label: string;
}

function StepBadge({ step, current, label }: StepBadgeProps) {
  const done = current > step;
  const active = current === step;
  return (
    <div className={`${styles.stepBadge} ${active ? styles.stepActive : ""} ${done ? styles.stepDone : ""}`}>
      <span className={styles.stepNumber}>{done ? <CheckIcon size={12} /> : step}</span>
      <span className={styles.stepLabel}>{label}</span>
    </div>
  );
}

const STEPS = [
  { step: 1, label: "Ingressos" },
  { step: 2, label: "Pagamento" },
  { step: 3, label: "Confirmação" },
];

interface StepperProps {
  current: number;
}

export function Stepper({ current }: StepperProps) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((s, i) => (
        <Fragment key={s.step}>
          <StepBadge step={s.step} current={current} label={s.label} />
          {i < STEPS.length - 1 && (
            <div className={`${styles.stepLine} ${current > s.step ? styles.stepLineDone : ""}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}
