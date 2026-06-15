;; veild-tips.clar
;; Send STX tips to creators with a platform fee split.
;; Full parity with VeildTips.sol: fee calculation, per-creator earnings
;; tracking, fee withdrawal, pause/unpause, and on-chain events.

(define-constant CONTRACT-OWNER tx-sender)

;; ── Errors ────────────────────────────────────────────────────────────────────

(define-constant ERR-INVALID-AMOUNT  (err u200))
(define-constant ERR-ONLY-OWNER      (err u202))
(define-constant ERR-PAUSED          (err u203))
(define-constant ERR-TRANSFER-FAILED (err u204))

;; ── Constants ─────────────────────────────────────────────────────────────────

;; 3% platform fee (300 / 10000)
(define-constant PLATFORM-FEE-BPS u300)
(define-constant BPS-DENOMINATOR  u10000)

;; ── Data vars ─────────────────────────────────────────────────────────────────

(define-data-var platform-fees-collected uint u0)
(define-data-var paused                  bool false)

;; ── Data maps ─────────────────────────────────────────────────────────────────

;; Cumulative earnings per creator (in micro-STX, after platform fee)
(define-map creator-earnings principal uint)

;; ── Guards ────────────────────────────────────────────────────────────────────

(define-private (assert-not-paused)
  (asserts! (not (var-get paused)) ERR-PAUSED)
)

(define-private (assert-owner)
  (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-ONLY-OWNER)
)

;; ── Helpers ───────────────────────────────────────────────────────────────────

(define-private (calculate-fee (amount uint))
  (/ (* amount PLATFORM-FEE-BPS) BPS-DENOMINATOR)
)

;; ── Public: tip ───────────────────────────────────────────────────────────────

;; Send `amount` micro-STX to `creator` with an optional message.
;; Platform takes PLATFORM-FEE-BPS; the rest goes directly to creator.
(define-public (send-tip
    (creator principal)
    (amount  uint)
    (message (string-utf8 280)))
  (let
    ((fee         (calculate-fee amount))
     (creator-cut (- amount fee)))
    (try! (assert-not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    ;; Platform fee → contract owner
    (try! (stx-transfer? fee tx-sender CONTRACT-OWNER))
    ;; Creator share → creator directly
    (try! (stx-transfer? creator-cut tx-sender creator))
    ;; Bookkeeping
    (map-set creator-earnings creator
      (+ (default-to u0 (map-get? creator-earnings creator)) creator-cut)
    )
    (var-set platform-fees-collected
      (+ (var-get platform-fees-collected) fee)
    )
    (print {
      event:       "tip-sent",
      sender:      tx-sender,
      creator:     creator,
      amount:      amount,
      fee:         fee,
      creator-cut: creator-cut,
      message:     message,
      block:       block-height
    })
    (ok { fee: fee, creator-cut: creator-cut })
  )
)

;; ── Public: owner ─────────────────────────────────────────────────────────────

;; Withdraw accumulated platform fee STX to contract owner.
(define-public (withdraw)
  (let ((balance (stx-get-balance (as-contract tx-sender))))
    (try! (assert-owner))
    (asserts! (> balance u0) ERR-TRANSFER-FAILED)
    (as-contract (stx-transfer? balance tx-sender CONTRACT-OWNER))
  )
)

(define-public (pause)
  (begin
    (try! (assert-owner))
    (var-set paused true)
    (ok true)
  )
)

(define-public (unpause)
  (begin
    (try! (assert-owner))
    (var-set paused false)
    (ok true)
  )
)

;; ── Read-only ─────────────────────────────────────────────────────────────────

(define-read-only (get-creator-earnings (creator principal))
  (default-to u0 (map-get? creator-earnings creator))
)

(define-read-only (get-platform-fees-collected)
  (var-get platform-fees-collected)
)

(define-read-only (get-platform-fee-bps)
  PLATFORM-FEE-BPS
)

(define-read-only (is-paused)
  (var-get paused)
)
