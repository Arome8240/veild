;; veild-registry.clar
;; On-chain creator registry for Veild on Stacks.
;; Mirrors VeildRegistry.sol semantics — creators register a username,
;; bio, avatar, and category. All reads are public; writes require tx-sender.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-ALREADY-REGISTERED (err u100))
(define-constant ERR-NOT-REGISTERED      (err u101))
(define-constant ERR-USERNAME-TAKEN      (err u102))
(define-constant ERR-INVALID-USERNAME    (err u103))
(define-constant ERR-ONLY-OWNER          (err u104))
(define-constant ERR-NOT-CREATOR         (err u105))

(define-constant MAX-USERNAME-LEN u32)
(define-constant MAX-BIO-LEN      u160)

;; ── Data maps ──────────────────────────────────────────────────────────────────

(define-map creators principal
  {
    username:       (string-utf8 32),
    name:           (string-utf8 64),
    bio:            (string-utf8 160),
    avatar-cid:     (string-utf8 128),
    category:       (string-utf8 32),
    joined-at:      uint,
    total-messages: uint,
    is-verified:    bool,
    is-active:      bool
  }
)

(define-map username-to-principal (string-utf8 32) principal)

(define-data-var total-creators uint u0)
(define-data-var registration-fee uint u1000000) ;; 1 STX in micro-STX

;; ── Public functions ───────────────────────────────────────────────────────────

(define-public (register
    (username (string-utf8 32))
    (name     (string-utf8 64))
    (bio      (string-utf8 160))
    (avatar-cid (string-utf8 128))
    (category (string-utf8 32)))
  (let
    ((fee (var-get registration-fee)))
    (asserts! (is-none (map-get? creators tx-sender)) ERR-ALREADY-REGISTERED)
    (asserts! (is-none (map-get? username-to-principal username)) ERR-USERNAME-TAKEN)
    (asserts! (> (len username) u2) ERR-INVALID-USERNAME)
    ;; Collect registration fee
    (try! (stx-transfer? fee tx-sender CONTRACT-OWNER))
    ;; Store creator
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
    (var-set total-creators (+ (var-get total-creators) u1))
    (ok true)
  )
)

(define-public (update-profile
    (name       (string-utf8 64))
    (bio        (string-utf8 160))
    (avatar-cid (string-utf8 128))
    (category   (string-utf8 32)))
  (let ((creator (unwrap! (map-get? creators tx-sender) ERR-NOT-REGISTERED)))
    (map-set creators tx-sender
      (merge creator {
        name:       name,
        bio:        bio,
        avatar-cid: avatar-cid,
        category:   category
      })
    )
    (ok true)
  )
)

(define-public (verify-creator (target principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-ONLY-OWNER)
    (let ((creator (unwrap! (map-get? creators target) ERR-NOT-REGISTERED)))
      (map-set creators target (merge creator { is-verified: true }))
      (ok true)
    )
  )
)

(define-public (set-registration-fee (fee uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-ONLY-OWNER)
    (var-set registration-fee fee)
    (ok true)
  )
)

;; ── Read-only functions ────────────────────────────────────────────────────────

(define-read-only (get-creator (principal principal))
  (map-get? creators principal)
)

(define-read-only (get-creator-by-username (username (string-utf8 32)))
  (match (map-get? username-to-principal username)
    addr (map-get? creators addr)
    none
  )
)

(define-read-only (is-registered (principal principal))
  (is-some (map-get? creators principal))
)

(define-read-only (get-total-creators)
  (var-get total-creators)
)

(define-read-only (get-registration-fee)
  (var-get registration-fee)
)
