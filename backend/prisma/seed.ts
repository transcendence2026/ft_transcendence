// Bulk seeding script for TasteSync 
// Populates: 20+ restaurants, 50+ dishes, tags, and 10 test users with full profiles
// Safe to re-run: it wipes the relevant tables before inserting fresh data

import { PrismaClient, Prisma, Cuisine } from '@prisma/client';
import { createHash } from 'node:crypto';


const prisma = new PrismaClient();

// ---- Helpers ----

// Generates a random integer between a minimum and maximum value
function randomInt(min: number, max: number): number {
	// Calculate the range size (Inclusive of both limits)
	const range = max - min + 1;
	// Math.random() gives a decimal from 0 (inclusive) up to 1 (exclusive)
	const randomDecimal = Math.random() * range;
	// Floor the result to get an integer, then shift it by 'min'
	return Math.floor(randomDecimal) + min;
}

// Returns a randomly selected element from an array
function randomChoice<T>(arr: T[]): T {
	// Pick a random index between 0 and the last element index (length - 1)
	const randomIndex = randomInt(0, arr.length - 1);
	// Return the element located at the randomly selected index
	return arr[randomIndex];
}

// Returns a random subset of elements from an array without mutating the original
function randomSubset<T>(arr: T[], count: number): T[] {
	// Create a copy of the array and shuffle it randomly
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	// Ensure we don't request more elements tha available, then extract the slice
	const safeCount = Math.min(count, arr.length);
	return shuffled.slice(0, safeCount);
}

// Generates a fast SHA-256 hash for a given password string
// Note: Intented for testing or mock data, not secure production password storage
// Placeholder hash for seed-only accounts (never use this in real auth flows)
function fakeHash(password: string): string {
	// Create a SHA-256 hash instance, feed the password, and return as hex
	return createHash('sha256').update(password).digest('hex');
}

// ---- Static data pools ----

const RESTAURANTS: { name: string; cuisine: Cuisine; priceRange: number }[] = [
	{ name: 'La Trattoria Nonna', cuisine: Cuisine.ITALIAN, priceRange: 2 },
	{ name: 'Osteria Del Porto', cuisine: Cuisine.ITALIAN, priceRange: 3 },
	{ name: 'Sakura Sushi Bar', cuisine: Cuisine.JAPANESE, priceRange: 3 },
	{ name: 'Ichiban Ramen House', cuisine: Cuisine.JAPANESE, priceRange: 2 },
	{ name: 'El Rincón de Taco', cuisine: Cuisine.MEXICAN, priceRange: 1 },
	{ name: 'Casa Jalapeño', cuisine: Cuisine.MEXICAN, priceRange: 2 },
	{ name: 'Taj Spice Kitchen', cuisine: Cuisine.INDIAN, priceRange: 2 },
	{ name: 'Bombay Curry House', cuisine: Cuisine.INDIAN, priceRange: 3 },
	{ name: 'Le Petit Bistro', cuisine: Cuisine.FRENCH, priceRange: 4 },
	{ name: 'Chez Amélie', cuisine: Cuisine.FRENCH, priceRange: 3 },
	{ name: 'Bodega Andaluza', cuisine: Cuisine.SPANISH, priceRange: 2 },
	{ name: 'Tapas & Vino', cuisine: Cuisine.SPANISH, priceRange: 2 },
	{ name: 'Bangkok Street Kitchen', cuisine: Cuisine.THAI, priceRange: 2 },
	{ name: 'Golden Lotus Thai', cuisine: Cuisine.THAI, priceRange: 3 },
	{ name: 'Route 66 Diner', cuisine: Cuisine.AMERICAN, priceRange: 1 },
	{ name: 'Smokehouse BBQ Co.', cuisine: Cuisine.AMERICAN, priceRange: 2 },
	{ name: 'Olive & Thyme', cuisine: Cuisine.MEDITERRANEAN, priceRange: 3 },
	{ name: 'Santorini Grill', cuisine: Cuisine.MEDITERRANEAN, priceRange: 2 },
	{ name: 'Golden Dragon', cuisine: Cuisine.CHINESE, priceRange: 2 },
	{ name: 'Panda Wok', cuisine: Cuisine.CHINESE, priceRange: 1 },
	{ name: 'Seoul Garden', cuisine: Cuisine.KOREAN, priceRange: 3 },
	{ name: 'Saigon Corner', cuisine: Cuisine.VIETNAMESE, priceRange: 2 },
];

// Dish templates per cuisine: [name, description]
const DISH_POLL: Record<Cuisine, [string, string][]> = {
	[Cuisine.ITALIAN]: [
		['Margherita Pizza', 'Classic tomato, mozzarella and basil'],
		['Spaghetti Carbonara', 'Egg, pecorino, guanciale and black pepper'],
		['Lasagna alla Bolognese', 'Layered pasta with slow-cooked meat ragù'],
		['Risotto ai Funghi', 'Creamy risotto with wild mushrooms'],
	],
	[Cuisine.JAPANESE]: [
		['Salmon Nigiri', 'Fresh salmon over seasoned rice'],
		['Tonkotsu Ramen', 'Rich pork bone broth with chashu'],
		['Chicken Katsu Curry', 'Crispy chicken cutlet with Japanese curry'],
		['Dragon Roll', 'Eel and avocado maki roll'],
	],
	[Cuisine.MEXICAN]: [
		['Tacos al Pastor', 'Marinated pork with pineapple and cilantro'],
		['Chicken Enchiladas', 'Corn tortillas rolled with cheese and red sauce'],
		['Guacamole & Chips', 'Fresh avocado dip with tortilla chips'],
		['Carne Asada Burrito', 'Grilled beef, rice, beans and salsa'],
	],
	[Cuisine.INDIAN]: [
		['Butter Chicken', 'Creamy tomato curry with tandoori chicken'],
		['Paneer Tikka Masala', 'Grilled paneer in spiced tomato gravy'],
		['Chana Masala', 'Spiced chickpea curry'],
		['Lamb Biryani', 'Fragrant rice layered with spiced lamb'],
	],
	[Cuisine.FRENCH]: [
		['Coq au Vin', 'Chicken braised in red wine'],
		['Boeuf Bourguignon', 'Slow-cooked beef stew in red wine'],
		['Ratatouille', 'Stewed Provençal vegetables'],
		['Crème Brûlée', 'Vanilla custard with caramelized sugar top'],
	],
	[Cuisine.SPANISH]: [
		['Paella Valenciana', 'Saffron rice with chicken and rabbit'],
		['Patatas Bravas', 'Fried potatoes with spicy tomato sauce'],
		['Jamón Ibérico Board', 'Cured Iberian ham selection'],
		['Tortilla Española', 'Classic potato and egg omelette'],
	],
	[Cuisine.THAI]: [
		['Pad Thai', 'Stir-fried rice noodles with tamarind sauce'],
		['Green Curry Chicken', 'Coconut curry with Thai basil'],
		['Tom Yum Soup', 'Hot and sour shrimp soup'],
		['Mango Sticky Rice', 'Sweet coconut rice with fresh mango'],
	],
	[Cuisine.AMERICAN]: [
		['Classic Cheeseburger', 'Beef patty, cheddar, lettuce and tomato'],
		['BBQ Pulled Pork Sandwich', 'Slow-smoked pork with coleslaw'],
		['Mac & Cheese', 'Baked pasta in cheese sauce'],
		['Buffalo Wings', 'Crispy wings tossed in spicy buffalo sauce'],
	],
	[Cuisine.MEDITERRANEAN]: [
		['Falafel Wrap', 'Chickpea fritters with tahini sauce'],
		['Greek Salad', 'Tomato, cucumber, olives and feta'],
		['Lamb Souvlaki', 'Grilled skewers with tzatziki'],
		['Hummus Plate', 'Chickpea dip with warm pita'],
	],
	[Cuisine.CHINESE]: [
		['Kung Pao Chicken', 'Stir-fried chicken with peanuts and chili'],
		['Sweet and Sour Pork', 'Crispy pork in tangy sauce'],
		['Vegetable Dumplings', 'Steamed dumplings with vegetable filling'],
		['Beef Chow Mein', 'Stir-fried noodles with beef and vegetables'],
	],
	[Cuisine.KOREAN]: [
		['Bibimbap', 'Mixed rice bowl with vegetables and gochujang'],
		['Korean Fried Chicken', 'Double-fried chicken with sweet-spicy glaze'],
		['Kimchi Jjigae', 'Spicy kimchi and pork stew'],
		['Bulgogi', 'Marinated grilled beef'],
	],
	[Cuisine.VIETNAMESE]: [
		['Pho Bo', 'Beef noodle soup with herbs'],
		['Banh Mi', 'Baguette sandwich with pork and pickled vegetables'],
		['Fresh Spring Rolls', 'Rice paper rolls with shrimp and herbs'],
		['Bun Cha', 'Grilled pork with rice noodles'],
	],
};

const TAG_NAMES = [
	'Vegan',
	'Vegetarian',
	'Gluten-Free',
	'Spicy',
	'Popular',
	"Chef's Special",
	'Seasonal',
	'Kids Friendly',
	'Low-Carb',
	'Dairy-Free',
	'Signature',
	'New',
	'Comfort Food',
	'Healthy',
	'Shareable',
];

const FIRST_NAMES = [
	'Lucia', 'Allan', 'Patricia', 'Antonio', 'Ana',
	'Mateo', 'Nora', 'Hugo', 'Alicia', 'Pablo'
];

const LAST_NAMES = [
	'Garcia', 'Silva', 'Quesada', 'Rossi', 'Tanaka',
	'Ruz', 'Garrido', 'Mondon', 'Landeira', 'Romero'
];

// ---- Main seeding logic ----

/* Clears all database tables prior to re-seeding.
 * Deletes child records before parent records to satisfy foreign key constraints
 * and avoid referentialintegrity errors (even with cascading deletes enabled)
*/
async function cleanup() {
	// 1. Delete dependents / child entities with foreign key references
	await prisma.review.deleteMany();
	await prisma.message.deleteMany();
	await prisma.post.deleteMany();
	await prisma.block.deleteMany();
	await prisma.friendship.deleteMany();
	await prisma.dish.deleteMany();
	// 2. Delete mid-level parent entities
	await prisma.restaurant.deleteMany();
	await prisma.tag.deleteMany();
	// 3. Delete root parent entities
	await prisma.profile.deleteMany();
	await prisma.user.deleteMany();
}

// Seeds the data base with predefined tag names
async function seedTags() {
	await prisma.tag.createMany({
		data: TAG_NAMES.map((name) => ({ name })),
		skipDuplicates: true,
	});
	return prisma.tag.findMany({
		where: { name: { in: TAG_NAMES } },
	});
}

// Seeds restaurants and their associated dishes, linking each dish with random tags
async function seedRestaurantsAndDishes(tags: { id: string; name: string }[]) {
	let totalDishes = 0;

	// Loop through each restaurant definitions in the RESTAURANTS array
	for (const restaurantData of RESTAURANTS) {
		// Create the restaurant record in the database
		const restaurant = await prisma.restaurant.create({ data: restaurantData });

		// Fetch the dish templates matching the restaurant's cuisine (fallback to empty array)
		const dishTemplates = DISH_POLL[restaurantData.cuisine];
		// 3-4 dishes per restaurant -> comfortably clears the 50+ dish requirement
		const dishCount = randomInt(3, 4);

		for (let i = 0; i < dishCount; i++) {
			// Get dish name and description using modulo to safely cucle through templates
			const [name, description] = dishTemplates[i % dishTemplates.length];
			// Select a random subset of 1 to 3 tags for this dish
			const assignedTags = randomSubset(tags, randomInt(1, 3));

			// Create the dish in the database linked to the current restaurant and selected tags
			await prisma.dish.create({
				data: {
					name,
					description,
					// Generate a price ending in 50 (e.g., 12.50) formatted to 2 decimals
					price: parseFloat((randomInt(6, 32) + 0.5).toFixed(2)),
					restaurantId: restaurant.id,
					tags: {
						// Prisma syntax to associate existing tags via their unique IDs
						connect: assignedTags.map((tag) => ({ id: tag.id})),
					},
				},
			});
			totalDishes++;
		}
	}
	// Return the total count of created dishes
	return totalDishes;
}

// Seeds the database with mock user records and nested profile data
async function seedUsers() {
	// Generate a SHA-256 password hash to reuse across all seeded users
	const passwordHash = fakeHash('Password123!');
	const cuisineNames = Object.keys(DISH_POLL) as Cuisine[];

	for (let i = 0; i < 10; i++) {
		const firstName = FIRST_NAMES[i];
		const lastName = randomChoice(LAST_NAMES);
		const username = `${firstName.toLowerCase()}${randomInt(10, 99)}`;

		// Pick 2-4 favorite cuisines and a coherent min/max price range
		const favoriteCuisines = randomSubset(cuisineNames, randomInt(2, 4));
		const priceMin = randomInt(1, 3);
		const priceMax = randomInt(priceMin, 4);

		// Create user along with a nested profile in a single Prisma operation
		await prisma.user.create({
			data: {
				email: `${username}@tastesync.dev`,
				username,
				passwordHash,
				role: 'USER',
				status: 'OFFLINE',
				profile: {
					create: {
						firstName,
						lastName,
						bio: `Food lover exploring the best ${randomChoice(Object.keys(DISH_POLL),)} spots in town.`,
					},
				},
				preference: {
					create: {
						favoriteCuisines,
						spicyLevel: randomInt(1, 5),
						preferredPriceMin: priceMin,
						preferredPriceMax: priceMax,
					},
				},
			},
		});
	}

	return prisma.user.findMany({ select: { id: true, username: true } });
}

async function seedPosts(users: { id: string; username: string }[]) {
	const posts = [
		{
			title: 'A bright start to the weekend',
			content: 'Fresh herbs, warm bread and a table full of people. What is everyone cooking this weekend?',
			imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'The comfort bowl I keep coming back to',
			content: 'A little heat, plenty of texture and the kind of meal that gets better with every bite.',
			imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Plating practice: less is more',
			content: 'Trying a cleaner plating style tonight. The garnish should support the dish, not compete with it.',
			imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'A sweet finish',
			content: 'Sharing the dessert that disappeared before I could take a second photo.',
			imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Sunday market colours',
			content: 'A basket of tomatoes, basil and citrus is enough inspiration for the whole afternoon.',
			imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'The ramen experiment',
			content: 'Testing a richer broth today and keeping the toppings simple so the noodles stay centre stage.',
			imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Tacos for the whole table',
			content: 'Crisp onions, smoky salsa and a stack of warm tortillas. This one is made for sharing.',
			imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'A green lunch break',
			content: 'The quickest way to make lunch feel special: a bright dressing and one extra handful of herbs.',
			imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Learning to love lentils',
			content: 'Slow spices, roasted vegetables and a spoonful of yoghurt turned a pantry dinner into a favourite.',
			imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Pizza night notes',
			content: 'The dough finally has the bubbles I was looking for. Next challenge: getting everyone a slice before it cools.',
			imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Rainy day comfort food',
			content: 'There is no better weather for a slow stew, toasted bread and an unnecessarily large mug of tea.',
			imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'A little more spice',
			content: 'Trying the chilli oil from the new market stall. It starts gentle and finishes with a proper kick.',
			imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Breakfast worth waking up for',
			content: 'Crisp edges, a runny centre and coffee strong enough to make the morning feel intentional.',
			imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'A new favourite side dish',
			content: 'Roasted carrots with tahini, lemon and toasted seeds. Simple, colourful and already requested again.',
			imageUrl: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Cooking with friends',
			content: 'Everyone brought one ingredient and somehow the result tasted like we planned it all along.',
			imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'The last slice debate',
			content: 'A serious community question: does the person who cooked get the last slice, or the person who washed up?',
			imageUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Fresh pasta practice',
			content: 'The first batch was uneven, the second batch was better, and the third batch never made it to the plate.',
			imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'Notes from the bakery',
			content: 'A warm loaf, a sharp knife and five quiet minutes before the house wakes up.',
			imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
		},
		{
			title: 'What is on your plate?',
			content: 'Starting a small thread for weekday meals that are fast, generous and worth repeating.',
			imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
		},
	];

	for (const [index, post] of posts.entries()) {
		const author = users[index % users.length];
		await prisma.post.create({
			data: {
				title: post.title,
				content: post.content,
				authorId: author.id,
				createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
				images: { create: [{ url: post.imageUrl }] },
			},
		});
	}

	return posts.length;
}

// Seeds reviews: each user reviews a random subset of dishes, respecting the
// @@unique([authorId, dishId]) constraint (one review per user per dish)
async function seedReviews(users: { id: string; username: string }[]) {
	const dishes = await prisma.dish.findMany({ select: { id: true } });
	let totalReviews = 0;

	for (const user of users) {
		// Each user reviews 5-10 random dishes
		const dishesToReview = randomSubset(dishes, randomInt(5, 10));

		for (const dish of dishesToReview) {
			await prisma.review.create({
				data: {
					rating: randomInt(1, 5),
					comment: randomChoice([
						'Loved it, will order again.',
						'Good but a bit pricey.',
						'Exceeded expectations!',
						'Decent, nothing special.',
						null,
					]),
					authorId: user.id,
					dishId: dish.id,
				},
			});
			totalReviews++;
		}
	}

	return totalReviews;
}

// Main orchestrator function that executes the database seeding workflow in order
async function main() {
	// Step 1: Wipe existing database records to maintain a clean test environment
	console.log('Cleaning up existing data...');
	await cleanup();

	// Step 2: Seed tag records first so dishes can reference their IDs
	console.log('Seeding tags...');
	const tags = await seedTags();

	// Step 3: Seed resturants and dishes, passing down created tags for relational connections
	console.log('Seeding restaurants and dishes...');
	const dishCount = await seedRestaurantsAndDishes(tags);

	// Step 4: Seed test user accounts along with their profile data
	console.log('Seeding test users...');
	const users = await seedUsers();

	// Step 5: Seed social content so the dashboard feed has real examples.
	console.log('Seeding social posts...');
	const postCount = await seedPosts(users);

	// Step 6: Seed reviews
	console.log('Seeding reviews...');
	const reviewCount = await seedReviews(users);

	// Log a summary of all inserted entities
	console.log(`Done: ${RESTAURANTS.length} restaurants, ${dishCount} dishes, ${tags.length} tags, ${users.length} users, ${postCount} posts.`);
}

// Execute the main seeding flow with error handling and cleanup logic
main()
	.catch((e) => {
		// Log any uncaught exception during seeding and exit the process with failure status (1)
		console.error('Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		// Safely close the Prisma Client database connection upon completion or error
		await prisma.$disconnect();
	});
