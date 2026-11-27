# AUTO GL SRLS

Site de démonstration d'achat de véhicules électriques d'occasion, en français et en euros. Le site porte le nom **AUTO GL SRLS** et utilise une partie des visuels du design study d'origine (release tag `v1.0.0`). Il s'agit d'un projet distinct : le release original reste intact dans un autre dossier et sur le port 5220.

## Lancer le projet

Node.js 22+ et pnpm 10.15.1 sont requis.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm dev:full
```

`pnpm dev:full` démarre en parallèle l'API (`http://127.0.0.1:3001`) et Vite (`http://127.0.0.1:5221`). Vite proxyfie toutes les requêtes `/api` vers l'API. `pnpm dev` lance uniquement le frontend ; dans ce cas les fonctionnalités API affichent un message d'erreur clair et un bouton Réessayer.

La base de données doit être initialisée séparément avec `pnpm db:push` puis `pnpm db:seed`, et les variables de `.env.example` doivent être renseignées dans `.env` (aucun secret n'est embarqué dans le frontend).

Avec Neon, utiliser l'**endpoint direct** (host sans `-pooler`) pour `DATABASE_URL` : la création de commande utilise une transaction interactive Prisma, incompatible avec le pooler en mode transaction (`P2028`). L'URL poolée fonctionne pour `db push`, mais pas pour ce parcours.

## Fonctionnalités

### Catalogue public

- Accueil avec sélection de véhicules et présentation du parcours.
- Catalogue avec recherche, filtres (couleur, jantes, année, prix, kilométrage, garantie) et tri. L'accueil, le catalogue, les fiches, le comparateur, les favoris et la commande lisent `GET /api/cars` : les véhicules ajoutés dans l'admin apparaissent immédiatement. Les 8 véhicules de `src/data/vehicles.ts` servent uniquement de repli si l'API est indisponible, et la liste est rechargée à chaque navigation.
- Fiche véhicule : galerie navigable avec plusieurs images par véhicule, description structurée en paragraphes et listes, caractéristiques, équipements, vues techniques, demande d'essai et commande. Une annonce avec une seule image reste affichable.
- Favoris et comparateur (3 véhicules maximum, ancien retiré automatiquement) persistés dans `localStorage` (`auto-gl-srls:favorites` et `auto-gl-srls:compare`). Ces deux listes restent **locales au navigateur** et ne passent pas par l'API.
- Navigation par hash : `#/`, `#/catalogue`, `#/vehicule/...`, `#/favoris`, `#/comparateur`, `#/simulation`, `#/suivi[/:commande]`, `#/commande-confirmee/:commande`, `#/commander/:id`, `#/alerte/:token`, `#/admin[/...]`, `#/contact`, `#/mentions-legales`.
- Interface responsive : même identité visuelle du desktop au mobile, avec menu repliable, filtres repliables sur petit écran, grilles empilées, cibles tactiles élargies et comparateur présenté en fiches sans défilement horizontal.

### Fonctionnalités API

- **Simulation** (`#/simulation`) : le serveur calcule la capacité mensuelle (30 % du revenu retenu) et renvoie les véhicules compatibles ; aucun résultat n'est inventé côté navigateur si l'API est indisponible.
- **Commande** (`#/commander/:id`) : validation locale puis `POST /api/orders`, confirmation avec numéro de commande (`#/commande-confirmee/:commande`). La commande est enregistrée côté serveur ; deux e-mails sont envoyés si SMTP est configuré : confirmation détaillée au client et notification à l'équipe (`LEADS_EMAIL`). Le statut des envois est renvoyé dans `emails`.
- **Suivi** (`#/suivi`) : numéro de commande + e-mail (`POST /api/orders/track`), stepper en 5 étapes, récapitulatif financier, échéancier, historique et coordonnées bancaires affichées uniquement après confirmation (statut `CONFIRMED` ou plus).
- **Alertes** : création depuis le catalogue avec les filtres courants, puis gestion via le lien privé `#/alerte/:token` (activation, désactivation, suppression). Le token vient de l'URL, aucun secret n'est embarqué.
- **Administration** (`#/admin`, `#/admin/vehicules`, `#/admin/commandes`, `#/admin/clients`, `#/admin/paiements`, `#/admin/parametres`) : accès **uniquement par code** (`POST /api/admin/login` avec `{code}`), haché dans `.env` (`ADMIN_CODE_HASH`) et jamais embarqué dans le frontend ; ni e-mail ni mot de passe ne sont acceptés. Le JWT obtenu est revérifié par `/api/auth/me` avec le rôle `ADMIN`. Statistiques, CRUD véhicules, upload de plusieurs images par véhicule (envoi direct navigateur → Cloudinary avec signature générée par l'API, sans transiter par la limite de 4,5 Mo des functions Vercel), statuts de commandes et de paiements, coordonnées bancaires.
- **Aucun compte client** : il n'existe ni page de connexion ni inscription ; une commande se suit avec son numéro et son e-mail via `#/suivi`.
- **Contact** : demandes d'essai et messages transmis à `POST /api/leads`.

Les IBAN, bénéficiaires et autres coordonnées bancaires affichés proviennent exclusivement de l'enregistrement effectué dans l'espace admin (`#/admin/parametres`), stocké en base via `PUT /api/admin/bank` : ils ne sont jamais lus depuis `.env` ni codés dans le frontend. Sans saisie admin, l'API renvoie des champs vides. Les seules données d'entreprise présentes dans le code viennent de `src/data/company.ts`.

## Limites

- Les annonces, véhicules et prix de la sélection de démonstration sont fictifs ; seules les informations légales sont celles communiquées.
- L'envoi d'e-mails utilise le compte SMTP professionnel renseigné dans `.env` (`SMTP_*`, `FROM_EMAIL`, `LEADS_EMAIL`) ; sans configuration, l'API continue de fonctionner en journalisant les messages non envoyés.
- Les visuels utilisés proviennent d'un design study placé sous licence MIT ; voir LICENSE.

## Attribution

Projet dérivé d'un design study publié sous licence MIT (tag `v1.0.0`). Création originale : Amir Mušić. Voir `LICENSE` et `THIRD_PARTY_NOTICES.md`.
