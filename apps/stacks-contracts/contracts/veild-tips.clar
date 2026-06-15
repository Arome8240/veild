;; veild-tips.clar
;; Tip creators in STX with a platform fee split.
;; Mirrors VeildTips.sol: platform takes PLATFORM-FEE-BPS, rest goes to creator.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-REGISTERED  (err u200))
(define-constant ERR-INVALID-AMOUNT  (err u201))
(define-constant ERR-ONLY-OWNER      (err u202))
(define-constant ERR-TRANSFER-FAILED (err u203))

;; 3% (300 / 10000)
(define-constant PLATFORM-FEE-BPS u300)
(define-constant BPS-DENOMINATOR   u10000)

;; ── Data maps ──────────────────────────────────────────────────────────────────

;; Earnings per creator (in micro-STX)
(define-map creator-earnings principal uint)

;; Total platform fees collected (in micro-STX)
(define-data-var platform-fees-collected uint u0)

;; ── Internal helpers ───────────────────────────────────────────────────────────

(define-private (calculate-fee (amount uint))
  (/ (* amount PLATFORM-FEE-BPS) BPS-DENOMINATOR)
)

(define-private (is-creator-registered (target principal))
  ;; Dynamic call to veild-registry — works when both contracts are deployed
  ;; by the same deployer in the same block order.
  (contract-call? .veild-registry is-registered target)
)

;; ── Public functions ───────────────────────────────────────────────────────────

(define-public (send-tip (creator principal) (message (string-utf8 280)))
  (let
    (
      (amount (stx-get-balance tx-sender))
      ;; Caller must send exactly the value they want to tip via the tx value —
      ;; but Clarity lacks msg.value, so we instead require the caller to pass
      ;; the tip amount explicitly.
    )
    ;; Validate caller's intent — see send-tip-amount below for the real entry-point.
    (send-tip-amount creator message u0)
  )
)

;; Primary entry-point: tip `amount` micro-STX to `creator`.
(define-public (send-tip-amount
    (creator principal)
    (message  (string-utf8 280))
    (amount   uint))
  (let
    (
      (fee        (calculate-fee amount))
      (creator-cut (- amount fee))
    )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    ;; Transfer platform fee to contract owner
    (try! (stx-transfer? fee tx-sender CONTRACT-OWNER))
    ;; Transfer creator's share directly to them
    (try! (stx-transfer? creator-cut tx-sender creator))
    ;; Update bookkeeping
    (map-set creator-earnings creator
      (+ (default-to u0 (map-get? creator-earnings creator)) creator-cut)
    )
    (var-set platform-fees-collected
      (+ (var-get platform-fees-collected) fee)
    )
    (ok { fee: fee, creator-cut: creator-cut })
  )
)

;; ── Read-only functions ────────────────────────────────────────────────────────

(define-read-only (get-creator-earnings (creator principal))
  (default-to u0 (map-get? creator-earnings creator))
)

(define-read-only (get-platform-fees-collected)
  (var-get platform-fees-collected)
)

(define-read-only (get-platform-fee-bps)
  PLATFORM-FEE-BPS
)
