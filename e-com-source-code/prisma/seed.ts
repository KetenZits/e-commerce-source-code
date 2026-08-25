import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { BANGKOK_METRO } from "../src/lib/constants";

const db = new PrismaClient();

async function main() {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.address.deleteMany();
  await db.review.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.shippingZone.deleteMany();
  await db.notificationLog.deleteMany();
  await db.account.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  const adminHash = await bcrypt.hash("admin1234", 10);
  const buyerHash = await bcrypt.hash("buyer1234", 10);

  const admin = await db.user.create({
    data: {
      email: "admin@atelier.dev",
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const buyer = await db.user.create({
    data: {
      email: "buyer@atelier.dev",
      name: "Buyer",
      passwordHash: buyerHash,
      role: "BUYER",
    },
  });

  await db.address.create({
    data: {
      userId: buyer.id,
      recipientName: "Buyer Atelier",
      phone: "0812345678",
      addressLine1: "12 Charoen Krung",
      subdistrict: "Bang Rak",
      district: "Bang Rak",
      province: "Bangkok",
      postalCode: "10500",
      isDefault: true,
    },
  });

  const apparel = await db.category.create({ data: { name: "Apparel", slug: "apparel" } });
  const home = await db.category.create({ data: { name: "Home", slug: "home" } });
  const kitchen = await db.category.create({
    data: { name: "Kitchen", slug: "kitchen", parentId: home.id },
  });
  const accessories = await db.category.create({ data: { name: "Accessories", slug: "accessories" } });

  await db.shippingZone.createMany({
    data: [
      {
        name: "Bangkok metro, light",
        provinces: [...BANGKOK_METRO],
        minWeightGrams: 0,
        maxWeightGrams: 2000,
        feeCents: 5000,
        sortOrder: 10,
      },
      {
        name: "Bangkok metro, heavy",
        provinces: [...BANGKOK_METRO],
        minWeightGrams: 2001,
        maxWeightGrams: null,
        feeCents: 8000,
        sortOrder: 20,
      },
      {
        name: "Nationwide, light",
        provinces: ["*"],
        minWeightGrams: 0,
        maxWeightGrams: 2000,
        feeCents: 8000,
        sortOrder: 30,
      },
      {
        name: "Nationwide, heavy",
        provinces: ["*"],
        minWeightGrams: 2001,
        maxWeightGrams: null,
        feeCents: 12000,
        sortOrder: 40,
      },
    ],
  });

  const linen = await db.product.create({
    data: {
      slug: "linen-overshirt",
      title: "Linen overshirt",
      description:
        "A mid-weight linen overshirt cut for layering. Washed once so it arrives softened, with a clean stand collar and horn buttons. Wear it open over a tee, or closed as a light jacket.",
      brand: "Atelier",
      categoryId: apparel.id,
      basePriceCents: 289000,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1400&q=80",
      ],
      status: "PUBLISHED",
      variants: {
        create: [
          { sku: "ATL-LINEN-S-NAT", attributes: { size: "S", color: "Natural" }, priceCents: 289000, stockQty: 8, weightGrams: 420 },
          { sku: "ATL-LINEN-M-NAT", attributes: { size: "M", color: "Natural" }, priceCents: 289000, stockQty: 12, weightGrams: 440 },
          { sku: "ATL-LINEN-L-NAT", attributes: { size: "L", color: "Natural" }, priceCents: 289000, stockQty: 6, weightGrams: 460 },
          { sku: "ATL-LINEN-S-INK", attributes: { size: "S", color: "Ink" }, priceCents: 289000, stockQty: 4, weightGrams: 420 },
          { sku: "ATL-LINEN-M-INK", attributes: { size: "M", color: "Ink" }, priceCents: 289000, stockQty: 9, weightGrams: 440 },
          { sku: "ATL-LINEN-L-INK", attributes: { size: "L", color: "Ink" }, priceCents: 289000, stockQty: 0, weightGrams: 460 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      slug: "stoneware-mug",
      title: "Stoneware mug",
      description:
        "Thrown in a small Chiang Mai studio. The glaze pools slightly at the foot. Holds 280 ml, comfortable in one hand, safe in the dishwasher.",
      brand: "Khao Kiln",
      categoryId: kitchen.id,
      basePriceCents: 79000,
      images: [
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=1400&q=80",
      ],
      status: "PUBLISHED",
      variants: {
        create: [
          { sku: "KHAO-MUG-CLAY", attributes: { color: "Clay" }, priceCents: 79000, stockQty: 24, weightGrams: 380 },
          { sku: "KHAO-MUG-FOREST", attributes: { color: "Forest" }, priceCents: 79000, stockQty: 18, weightGrams: 380 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      slug: "leather-card-case",
      title: "Leather card case",
      description:
        "Vegetable-tanned cowhide, hand-stitched, sized for six cards and a folded note. It will darken with use. No logo on the face.",
      brand: "Atelier",
      categoryId: accessories.id,
      basePriceCents: 159000,
      images: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1590874103328-eac38a941954?auto=format&fit=crop&w=1400&q=80",
      ],
      status: "PUBLISHED",
      variants: {
        create: [
          { sku: "ATL-CARD-TAN", attributes: { color: "Tan" }, priceCents: 159000, stockQty: 14, weightGrams: 90 },
          { sku: "ATL-CARD-BLACK", attributes: { color: "Black" }, priceCents: 159000, stockQty: 11, weightGrams: 90 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      slug: "wool-throw",
      title: "Wool throw",
      description:
        "A compact throw in undyed merino. Dense enough for an evening on the sofa, light enough to keep at the foot of the bed. Fringed on two sides.",
      brand: "North Loom",
      categoryId: home.id,
      basePriceCents: 349000,
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80",
      ],
      status: "PUBLISHED",
      variants: {
        create: [
          { sku: "NL-THROW-IVORY", attributes: { color: "Ivory" }, priceCents: 349000, stockQty: 7, weightGrams: 980 },
          { sku: "NL-THROW-CHARCOAL", attributes: { color: "Charcoal" }, priceCents: 349000, stockQty: 5, weightGrams: 980 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      slug: "oak-serving-board",
      title: "Oak serving board",
      description:
        "White oak, oil-finished, with a shallow juice groove. For cheese, fruit, or a loaf. Hand-wash and oil occasionally.",
      brand: "Atelier",
      categoryId: kitchen.id,
      basePriceCents: 189000,
      images: [
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1563291074-2dee32c21fd5?auto=format&fit=crop&w=1400&q=80",
      ],
      status: "PUBLISHED",
      variants: {
        create: [
          { sku: "ATL-BOARD-SM", attributes: { size: "Small" }, priceCents: 189000, stockQty: 10, weightGrams: 720 },
          { sku: "ATL-BOARD-LG", attributes: { size: "Large" }, priceCents: 249000, stockQty: 6, weightGrams: 1100 },
        ],
      },
    },
  });

  await db.product.create({
    data: {
      slug: "cotton-tote",
      title: "Cotton tote",
      description:
        "Heavy canvas, unlined, with a wide gusset. Built for a market run or a laptop and a book. The Natural colourway is currently restocking.",
      brand: "Atelier",
      categoryId: accessories.id,
      basePriceCents: 69000,
      images: [
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1590874103328-eac38a941954?auto=format&fit=crop&w=1400&q=80",
      ],
      status: "PUBLISHED",
      variants: {
        create: [
          { sku: "ATL-TOTE-NAT", attributes: { color: "Natural" }, priceCents: 69000, stockQty: 0, weightGrams: 280 },
          { sku: "ATL-TOTE-INK", attributes: { color: "Ink" }, priceCents: 69000, stockQty: 16, weightGrams: 280 },
        ],
      },
    },
  });

  void linen;
  void admin;

  console.log("Seeded physical catalog");
  console.log("Admin  admin@atelier.dev / admin1234");
  console.log("Buyer  buyer@atelier.dev / buyer1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
