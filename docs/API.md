# API AUTO GL SRLS — v0.2.0

Backend Express 4 + Prisma 5 + PostgreSQL. Toutes les routes sont préfixées par `/api`.
Aucun serveur n'est démarré par l'import de `api/index.js` : celui-ci exporte l'application,
`server/index.js` s'occupe de l'écoute.

## 1. Installation et démarrage

Node.js >= 22 et pnpm 10.15.1 sont requis.

```sh
cp .env.example .env
# renseigner DATABASE_URL, DIRECT_URL, JWT_SECRET, ADMIN_CODE_HASH, ...
pnpm db:push
pnpm db:seed
pnpm api
```

Le seed (`tsx prisma/seed.js`) importe `src/data/vehicles.ts`, synchronise les 8 véhicules
( `brandKey: 'AUTO GL'`, `fuel: 'ELECTRIC'`, `transmission: 'AUTOMATIC'`, `category: 'CITY'`,
`slug` dérivé de l'id ) et crée l'administrateur si `ADMIN_CODE_HASH` est renseigné.
Le compte admin reçoit un mot de passe aléatoire non affiché : la connexion se fait
**uniquement** par `{code}`, comparé au hash bcrypt.
Les coordonnées bancaires ne sont **pas** semées : elles sont saisies uniquement
dans l'espace admin (`#/admin/parametres`) via `PUT /api/admin/bank` et stockées en base.

`pnpm dev:full` lance l'API (port 3001 par défaut) et Vite (port 5221) ; Vite proxifie `/api`.

### Variables d'environnement

| Variable | Usage |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Connexion PostgreSQL (Prisma) |
| `JWT_SECRET` | Signature des tokens (obligatoire pour auth) |
| `PORT` | Port de l'API, 3001 par défaut |
| `APP_URL` | Origine autorisée par CORS et lien dans les e-mails d'alerte |
| `ADMIN_CODE_HASH` | Hash bcrypt du code d'accès admin (jamais le code en clair) |
| `ADMIN_EMAIL` | Facultatif : choisit le compte admin associé au code (sinon le premier admin créé) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envoi d'e-mails (optionnel) |
| `FROM_EMAIL`, `FROM_NAME`, `LEADS_EMAIL` | Expéditeur et destinataire des messages de contact |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload d'images |

SMTP et Cloudinary sont **optionnels** : sans SMTP, les e-mails sont journalisés en
avertissement et les requêtes réussissent quand même ; sans Cloudinary, `POST /admin/uploads`
répond `503`.

## 2. Conventions

- Authentification : `Authorization: Bearer <token>` (JWT valable 7 jours).
- Cors : origine `APP_URL` si défini, sinon toutes les origines (`true`).
- Sécurité : `helmet()`, `express.json({limit:'1mb'})`, corps JSON uniquement (sauf upload).
- Corrélation : l'en-tête `X-Correlation-ID` est repris ou généré et renvoyé sur chaque réponse.
- Erreurs : `{ "error": "message", "details": ..., "requestId": "..." }` avec `400`
  (validation Zod / JSON invalide), `401` (auth), `403` (droits), `404` (ressource),
  `409` (conflit, par exemple e-mail déjà utilisé ou numéro de commande en doublon),
  `413` (fichier > 5 Mo), `429` (limiteur) et `500` (message générique, sans stack).
- Limiteurs : `/api/admin/login` (10/15 min),
  `/api/orders` (30/h, création et suivi), `/api/alerts` (30/h).
- Les routes `/admin/*` sauf `/api/admin/login` passent par `authenticateToken` puis
  `requireAdmin` (rôle revérifié en base, pas seulement dans le JWT).

## 3. Santé et authentification

| Méthode | Route | Auth | Réponse |
| --- | --- | --- | --- |
| GET | `/api/health` | — | `{name:'AUTO GL SRLS API',version:'0.2.0',status:'ok',time}` |
| GET | `/api/auth/me` | Bearer | `{user}` (revérification du JWT admin obtenu par code) |
| POST | `/api/admin/login` | — | `{user,token}` avec `{code}` uniquement |

Il n'existe plus de route publique d'inscription ou de connexion client.
Corps admin : `{code}` (chaîne de 4 à 64 caractères), comparé à `ADMIN_CODE_HASH`.
Un corps `{email,password}` est rejeté avec `400`. Le JWT obtenu est valable 7 jours.

## 4. Véhicules

| Méthode | Route | Auth | Réponse |
| --- | --- | --- | --- |
| GET | `/api/cars` | — | `{items:VehicleDTO[],total,page,limit,pages,filters}` |
| GET | `/api/cars/:id` | — | `VehicleDTO` (incrémente `views`) |

Paramètres de recherche : `search`, `color`, `wheels`, `year`, `minPrice`, `maxPrice`,
`maxMileage`, `warrantyOnly` (`true|1|oui`), `sort`, `page` (défaut 1), `limit` (défaut 12, max 100).
Tris acceptés : `price-asc`, `price-desc`, `year-asc`, `year-desc`, `mileage-asc`,
`mileage-desc`, `name-asc`, `name-desc`, `recent`, `featured` ; une valeur inconnue
retombe sur le tri par défaut (`isFeatured`, puis plus récent).
`filters` contient `colors`, `wheels`, `years`, `maxPrice`, `maxMileage` calculés sur
toutes les annonces actives.

`VehicleDTO` (correspond au type `Vehicle` du front, plus les champs de catalogue) :

```json
{
  "id": "studio-silver-2023",
  "brandKey": "AUTO GL",
  "name": "AUTO GL Studio Silver",
  "version": "Série 01 · Multi-spoke",
  "year": 2023,
  "mileage": 24500,
  "price": 27900,
  "color": "Studio Silver",
  "image": "/media/exterior-polished.png",
  "gallery": [{ "src": "...", "caption": "..." }],
  "wheels": "Multi-spoke",
  "location": "Lyon 3e",
  "warranty": "12 mois",
  "gearbox": "Automatique",
  "badges": ["Garantie 12 mois"],
  "description": "...",
  "equipment": ["..."],
  "fuel": "ELECTRIC",
  "transmission": "AUTOMATIC",
  "category": "CITY",
  "isFeatured": false,
  "isSold": false,
  "views": 0
}
```

## 5. Commandes et suivi

| Méthode | Route | Auth | Réponse |
| --- | --- | --- | --- |
| POST | `/api/orders` | Bearer optionnel (invité autorisé) | `{order:OrderDTO, emails:{customer,admin}}` — 201 |
| POST | `/api/orders/track` | — | `OrderDTO` (exige `orderNumber` **et** `email`) |
| GET | `/api/orders/my` | Bearer | `OrderDTO[]` |
| GET | `/api/orders/:id` | Bearer, propriétaire ou admin | `OrderDTO` |

Corps de création :

```json
{
  "carId": "studio-silver-2023",
  "customerName": "Jean Dupont",
  "customerEmail": "jean@example.com",
  "customerPhone": "0600000000",
  "address": "12 rue de la Paix",
  "postalCode": "69003",
  "city": "Lyon",
  "country": "France",
  "notes": "...",
  "purchaseType": "ACHAT",
  "deliveryType": "LIVRAISON",
  "paymentType": "full"
}
```

`purchaseType` : `ACHAT|LOCATION` ; `deliveryType` : `LIVRAISON|RETRAIT` ;
`paymentType` : `full|deposit|monthly` (converti en `PaymentPlan` `FULL|DEPOSIT|MONTHLY`).
Le numéro `AGL-AAAAMMJJ-XXXXXX` est généré en boucle jusqu'à obtenir une valeur unique. La création
écrit `Order`, `OrderItem` (snapshot du véhicule), `OrderTracking` initial (`PENDING`) et
les `Payment[]` du plan dans **une seule transaction**. `isSold` n'est **pas** modifié.

Plans de paiement (calcul centralisé dans `calculateOrderTotals`) :

- `full` : un paiement `TRANSFER` du prix total, `depositAmount = 0`.
- `deposit` : acompte de 30 % + solde de 70 %, deux paiements `CUSTOM`.
- `monthly` : apport de 25 %, 60 mensualités à 6 %/an (taux mensuel 0,5 %),
  premier paiement `CUSTOM` puis 60 paiements `MONTHLY` échelonnés.

`OrderDTO` :

```json
{
  "id": "...",
  "orderNumber": "AGL-20261124-1A2B3C",
  "createdAt": "2026-11-24T10:00:00.000Z",
  "status": "PENDING",
  "customerName": "...",
  "customerEmail": "...",
  "customerPhone": null,
  "address": "...",
  "postalCode": "...",
  "city": "...",
  "country": "France",
  "notes": null,
  "purchaseType": "ACHAT",
  "deliveryType": "LIVRAISON",
  "paymentType": "full",
  "totalPrice": 27900,
  "discountAmount": 0,
  "depositAmount": 0,
  "monthlyAmount": 0,
  "monthlyDuration": 0,
  "paymentReference": "AGL-20261124-1A2B3C",
  "paymentBeneficiary": "...",
  "paymentIban": "...",
  "paymentBic": "...",
  "paymentTransferType": "Virement",
  "items": [{ "vehicleId": "...", "name": "...", "version": "...", "image": "...", "quantity": 1, "unitPrice": 27900 }],
  "tracking": [{ "status": "PENDING", "note": "Commande reçue", "createdAt": "..." }],
  "payments": [{ "id": "...", "type": "TRANSFER", "status": "PENDING", "amount": 27900, "dueDate": null, "installmentNumber": 1 }]
}
```

`paymentType` est dérivé de `order.paymentPlan`. `paymentReference` reprend le numéro
de commande (aucune colonne dédiée dans le schéma). `discountAmount` vaut 0 : le schéma
ne prévoit pas de remise persistée. Les coordonnées bancaires sont figées sur la commande
au moment de sa création ; elles proviennent de l'enregistrement admin en base (champs
vides si aucune saisie n'a encore été faite), jamais de variables d'environnement.

Il n'existe **aucun** endpoint public `GET /orders/by-email` : le suivi se fait
uniquement par `POST /orders/track` avec numéro + e-mail.

## 6. Paiements (admin)

| Méthode | Route | Réponse |
| --- | --- | --- |
| GET | `/api/admin/payments` | `PaymentDTO[]` |
| PATCH | `/api/admin/payments/:id` | `PaymentDTO` |

Corps PATCH : `{status:'PENDING'|'COMPLETED'|'FAILED', paidAt?}`.
`PaymentDTO` : `{id,type,status,amount,dueDate,installmentNumber}`.

## 7. Administration

| Méthode | Route | Réponse |
| --- | --- | --- |
| GET | `/api/admin/stats` | `{totalClients,totalOrders,totalRevenue,pendingOrders,totalCars}` |
| GET | `/api/admin/clients` | `[{id,name,email,phone,role,orderCount,totalSpent,createdAt}]` |
| GET | `/api/admin/cars` | `{items:VehicleDTO[],total}` (inclut les annonces inactives) |
| POST | `/api/admin/cars` | `VehicleDTO` — 201 ; déclenche `notifyAlerts(car)` |
| GET | `/api/admin/cars/:id` | `VehicleDTO` |
| PUT | `/api/admin/cars/:id` | `VehicleDTO` |
| DELETE | `/api/admin/cars/:id` | `{ok:true}` |
| PATCH | `/api/admin/cars/:id/toggle` | `VehicleDTO` (bascule `isActive`) |
| GET | `/api/admin/orders` | `OrderDTO[]` (toutes les commandes, admin uniquement) |
| PATCH | `/api/admin/orders/:id` | `OrderDTO` |
| GET | `/api/admin/bank` | `BankInfo` (brut, ou `null`) |
| PUT | `/api/admin/bank` | `BankInfo` |
| POST | `/api/admin/upload-signature` | `{cloudName,apiKey,timestamp,signature,folder}` ; réservé ADMIN, permet l'envoi direct navigateur → Cloudinary |
| POST | `/api/admin/uploads` | `{url,publicId,images[]}` ; `multipart/form-data`, champ `image` (1 fichier) ou `images` (jusqu'à 12), max 5 Mo par fichier. Conservé pour compatibilité ; l'admin utilise désormais l'envoi direct. |

`PATCH /admin/orders/:id` accepte `{status?,note?,bankInfo?}` avec
`bankInfo = {beneficiary?,iban?,bic?,transferType?}`. L'ordre actuel est lu **avant**
la construction de l'objet de mise à jour ; chaque champ est replié avec
`valeur ?? currentOrder.champ ?? null`. Un e-mail au client n'est envoyé que
si le statut a changé ou si une note est fournie (et seulement si SMTP est configuré).
Une note crée une entrée de suivi.

À la création (`POST /api/orders`), deux e-mails sont envoyés et **awaités** avant
la réponse : une confirmation au client (`customerEmail`) et une notification à
l'équipe (`LEADS_EMAIL`, puis `ADMIN_EMAIL`, puis `FROM_EMAIL`). Le champ `emails`
de la réponse indique quels envois ont été acceptés par le serveur SMTP. Une panne
SMTP est journalisée et ne fait jamais échouer la création de la commande.

Les champs d'une annonce admin : `id?`, `name`, `version`, `year`, `mileage`, `price`,
`color`, `image`, `gallery[]`, `wheels`, `location`, `warranty`, `gearbox`, `badges[]`,
`description`, `equipment[]`, `technicalData?`, `fuel?`, `transmission?`, `category?`,
`isActive?`, `isFeatured?`, `isSold?`. Le `slug` est dérivé de l'id et rendu unique.
`gallery[]` accepte plusieurs images (`{src,caption}`). `POST /admin/uploads` peut
recevoir plusieurs fichiers dans le champ `images` (le champ `image` reste accepté
pour un seul fichier) : chaque URL renvoyée peut être ajoutée à la galerie. Si la
galerie est vide, `toVehicleDTO` renvoie au moins l'image principale.

## 8. Simulation

| Méthode | Route | Réponse |
| --- | --- | --- |
| POST | `/api/simulation` | `{salary,maxMonthly,maxAffordablePrice,count,vehicles:VehicleDTO[]}` |

Corps : `{salary,charges?,credit?,downPayment?}` ; `salary` est borné à 500..50000.
Une seule implémentation du calcul, partagée avec les plans `monthly` :

```
maxMonthly        = salary × 0,30
taux mensuel      = 6 % / 12 = 0,5 %
facteur annuité   = r / (1 - (1+r)^-60)
maxAffordablePrice= floor(maxMonthly / (0,75 × facteur))
mensualité        = round((prix × 0,75) × facteur)
```

`count` est le nombre de véhicules actifs dont le prix est <= `maxAffordablePrice`.
`charges`, `credit` et `downPayment` sont acceptés pour compatibilité client mais la
capacité reste la règle affichée (30 % du salaire, apport 25 %).

## 9. Contact et banque

| Méthode | Route | Auth | Réponse |
| --- | --- | --- | --- |
| POST | `/api/leads` | — | `{ok:true}` |
| GET | `/api/bank` | — | `{beneficiary,iban,bic,transferType}` |

`GET /api/bank` lit l'enregistrement actif créé par `PUT /api/admin/bank` (espace admin).
Sans saisie admin, tous les champs sont vides ; aucune variable d'environnement ne
fournit ces valeurs.

Corps lead : `{name,email,phone?,message}`. Le destinataire est `LEADS_EMAIL`, puis
`ADMIN_EMAIL`, puis `FROM_EMAIL`. Sans SMTP la requête répond quand même `{ok:true}`.

## 10. Favoris serveur

| Méthode | Route | Auth | Réponse |
| --- | --- | --- | --- |
| GET | `/api/favorites` | Bearer | `{items:VehicleDTO[]}` |
| POST | `/api/favorites` | Bearer | `{items:VehicleDTO[]}` — corps `{carId}` |
| DELETE | `/api/favorites/:carId` | Bearer | `{ok:true}` |

Le front peut conserver ses favoris locaux en parallèle.

## 11. Alertes (sans compte)

| Méthode | Route | Réponse |
| --- | --- | --- |
| POST | `/api/alerts` | `{token,existing}` — 201 |
| GET | `/api/alerts/:token` | `{token,email,name,filters,active,notifiedCount,createdAt,updatedAt}` |
| PATCH | `/api/alerts/:token` | même DTO ; corps `{active?}` |
| DELETE | `/api/alerts/:token` | `{ok:true}` |

Corps de création : `{email,name?,filters}` avec
`filters = {search?,color?,wheels?,year?,maxPrice?,maxMileage?,warrantyOnly?}`.
Règles : e-mail au format regex ; maximum **20 alertes par e-mail** (409 au-delà) ;
dédup exacte sur `(email, filters JSON normalisé)` — une alerte existante est réactivée
si elle était inactive (`existing: true`) ; le `token` (32 octets aléatoires) est la
seule clé d'accès, aucune authentification requise.

`notifyAlerts(car)` réutilise le même moteur de filtres que `/api/cars`. À chaque
`POST /admin/cars`, les alertes actives correspondantes voient leur `notifiedCount`
incrémenté ; un seul e-mail est envoyé par adresse, même si plusieurs alertes
du même destinataire correspondent.

## 12. Déploiement Vercel

`vercel.json` déclare `outputDirectory: dist`, les rewrites `/api/(.*)` ->
`/api/index.js` et SPA -> `index.html`, ainsi que les en-têtes CORS (l'origine est
émise dynamiquement par Express via `APP_URL`).

Les photos de l'admin ne passent pas par la function Vercel : le navigateur
demande `POST /api/admin/upload-signature` (JWT ADMIN), puis envoie chaque
fichier directement à `api.cloudinary.com`. Cela évite la limite de 4,5 Mo du
corps des requêtes et garde `CLOUDINARY_API_SECRET` côté serveur. Les variables
à renseigner dans le projet Vercel sont `DATABASE_URL`, `DIRECT_URL`,
`JWT_SECRET`, `APP_URL`, `ADMIN_CODE_HASH`, `ADMIN_EMAIL` (facultatif),
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `FROM_NAME`,
`LEADS_EMAIL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` et
`CLOUDINARY_API_SECRET`. `PORT` reste local et n'est pas nécessaire.

Le catalogue public (accueil, catalogue, fiches, favoris, comparateur, commande)
consomme `GET /api/cars?limit=100&sort=featured` via `VehiclesProvider`. La liste
locale `src/data/vehicles.ts` n'est plus qu'un repli hors ligne. Un ajout, une
modification ou une suppression dans l'admin rafraîchit immédiatement ce
provider, et un changement de hash le recharge également.
