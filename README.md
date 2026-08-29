# Thai PromptPay e-commerce source

Full application lives in [`e-com-source-code/`](./e-com-source-code). Start there.

**Do not ship `pass.txt`, `.env`, or `.next` to buyers.** Those files are local secrets and build output.

## Quick start

```bash
cd e-com-source-code
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Read `e-com-source-code/README.md` for demo logins, production checklist, and what is not included.

License: [LICENSE](./LICENSE)
