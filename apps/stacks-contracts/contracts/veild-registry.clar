;; veild-registry.clar
;; On-chain creator registry for Veild on Stacks.
;; Full parity with VeildRegistry.sol: registration, profile updates,
;; owner verification/deactivation, message counter, paginated list,
;; fee withdrawal, pause/unpause, and on-chain events via print.

(define-constant CONTRACT-OWNER tx-sender)

;; ── Errors ────────────────────────────────────────────────────────────────────

(define-constant ERR-ALREADY-REGISTERED (err u100))
(define-constant ERR-NOT-REGISTERED     (err u101))
(define-constant ERR-USERNAME-TAKEN     (err u102))
(define-constant ERR-INVALID-USERNAME   (err u103))
(define-constant ERR-ONLY-OWNER         (err u104))
(define-constant ERR-INSUFFICIENT-FEE   (err u106))
(define-constant ERR-PAUSED             (err u107))
(define-constant ERR-TRANSFER-FAILED    (err u108))

;; ── Data vars ─────────────────────────────────────────────────────────────────

(define-data-var total-creators    uint u0)
(define-data-var registration-fee  uint u1000000) ;; 1 STX in micro-STX
(define-data-var paused            bool false)
(define-data-var creator-list-len  uint u0)       ;; mirrors total-creators; used for list indexing

;; ── Data maps ─────────────────────────────────────────────────────────────────

(define-map creators principal
  {
    username:       (string-utf8 32),
    name:           (string-utf8 64),
    bio:            (string-utf8 280),
    avatar-cid:     (string-utf8 128),
    category:       (string-utf8 32),
    joined-at:      uint,
    total-messages: uint,
    is-verified:    bool,
    is-active:      bool
  }
)

;; username → principal
(define-map username-to-principal (string-utf8 32) principal)

;; sequential index → principal  (for paginated list)
(define-map creator-index uint principal)

;; ── Guards ────────────────────────────────────────────────────────────────────

(define-private (assert-not-paused)
  (asserts! (not (var-get paused)) ERR-PAUSED)
)

(define-private (assert-owner)
  (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-ONLY-OWNER)
)

;; ── Public: creator actions ───────────────────────────────────────────────────

(define-public (register
    (username   (string-utf8 32))
    (name       (string-utf8 64))
    (bio        (string-utf8 280))
    (avatar-cid (string-utf8 128))
    (category   (string-utf8 32)))
  (let
    ((fee (var-get registration-fee))
     (idx (var-get creator-list-len)))
    (try! (assert-not-paused))
    (asserts! (is-none (map-get? creators tx-sender))           ERR-ALREADY-REGISTERED)
    (asserts! (is-none (map-get? username-to-principal username)) ERR-USERNAME-TAKEN)
    (asserts! (> (len username) u0)                              ERR-INVALID-USERNAME)
    (asserts! (<= (len username) u32)                            ERR-INVALID-USERNAME)
    (asserts! (>= (stx-get-balance tx-sender) fee)              ERR-INSUFFICIENT-FEE)
    (try! (stx-transfer? fee tx-sender CONTRACT-OWNER))
    (map-set creators tx-sender {
      username:       username,
      name:           name,
      bio:            bio,
      avatar-cid:     avatar-cid,
      category:       category,
      joined-at:      block-height,
      total-messages: u0,
      is-verified:    false,
      is-active:      true
    })
    (map-set username-to-principal username tx-sender)
    (map-set creator-index idx tx-sender)
    (var-set total-creators   (+ (var-get total-creators) u1))
    (var-set creator-list-len (+ idx u1))
    (print { event: "creator-registered", creator: tx-sender, username: username, block: block-height })
    (ok true)
  )
)

(define-public (update-profile
    (name       (string-utf8 64))
    (bio        (string-utf8 280))
    (avatar-cid (string-utf8 128))
    (category   (string-utf8 32)))
  (let ((c (unwrap! (map-get? creators tx-sender) ERR-NOT-REGISTERED)))
    (try! (assert-not-paused))
    (asserts! (get is-active c) ERR-NOT-REGISTERED)
    (map-set creators tx-sender
      (merge c { name: name, bio: bio, avatar-cid: avatar-cid, category: category })
    )
    (print { event: "profile-updated", creator: tx-sender, block: block-height })
    (ok true)
  )
)

;; ── Public: cross-contract ────────────────────────────────────────────────────

;; Called by veild-messages to increment totalMessages for a creator.
;; In production restrict to a trusted messages-contract principal.
(define-public (increment-message-count (target principal))
  (begin
    (try! (assert-owner))
    (match (map-get? creators target)
      c (begin
          (when (get is-active c)
            (map-set creators target
              (merge c { total-messages: (+ (get total-messages c) u1) })
            )
          )
          (ok true)
        )
      (ok false)
    )
  )
)

;; ── Public: owner actions ─────────────────────────────────────────────────────

(define-public (set-verified (target principal) (verified bool))
  (let ((c (unwrap! (map-get? creators target) ERR-NOT-REGISTERED)))
    (try! (assert-owner))
    (map-set creators target (merge c { is-verified: verified }))
    (print { event: "creator-verified", creator: target, verified: verified })
    (ok true)
  )
)

(define-public (deactivate-creator (target principal))
  (let ((c (unwrap! (map-get? creators target) ERR-NOT-REGISTERED)))
    (try! (assert-owner))
    (map-set creators target (merge c { is-active: false }))
    (print { event: "creator-deactivated", creator: target })
    (ok true)
  )
)

(define-public (set-registration-fee (fee uint))
  (begin
    (try! (assert-owner))
    (var-set registration-fee fee)
    (ok true)
  )
)

;; Withdraw accumulated STX registration fees to the contract owner.
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

(define-read-only (get-creator (addr principal))
  (map-get? creators addr)
)

(define-read-only (get-creator-by-username (username (string-utf8 32)))
  (match (map-get? username-to-principal username)
    addr (map-get? creators addr)
    none
  )
)

(define-read-only (is-registered (addr principal))
  (match (map-get? creators addr)
    c    (get is-active c)
    false
  )
)

(define-read-only (get-total-creators)
  (var-get total-creators)
)

(define-read-only (get-registration-fee)
  (var-get registration-fee)
)

(define-read-only (is-paused)
  (var-get paused)
)

;; Returns the principal at sequential index `i` (for off-chain pagination).
(define-read-only (get-creator-at-index (i uint))
  (map-get? creator-index i)
)
