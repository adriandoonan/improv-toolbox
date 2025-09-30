import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const distRoot = new URL('../dist/', import.meta.url);

async function readDist(relativePath) {
  return readFile(new URL(relativePath, distRoot), 'utf8');
}

async function readDistOptional(relativePath) {
  try {
    return await readDist(relativePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

const [homeHtml, toolsHtml, exercisesHtml] = await Promise.all([
  readDist('index.html'),
  readDist('tools/index.html'),
  readDist('exercises/index.html'),
]);

const exercisesDir = new URL('../src/content/exercises/', import.meta.url);
const exerciseEntries = (await readdir(exercisesDir)).filter((name) =>
  name.endsWith('.md')
);
const expectedExerciseCount = exerciseEntries.length;

const [warmupsHtml, formsHtml] = await Promise.all([
  readDistOptional('warmups/index.html'),
  readDistOptional('forms/index.html'),
]);

function assertFavoritesIntegration(html, sectionLabel) {
  const favoritesCheckboxRegex = /<input[^>]*(?:type="checkbox"[^>]*name="favoritesOnly"|name="favoritesOnly"[^>]*type="checkbox")[^>]*>/;
  assert.ok(
    favoritesCheckboxRegex.test(html),
    `${sectionLabel} favorites-only checkbox filter missing`
  );
  const cardMatches = Array.from(
    html.matchAll(
      /<li[^>]*class="[^"]*resource-card[^"]*"[^>]*data-favorite="[^"]*"[^>]*>([\s\S]*?)<\/li>/g
    )
  );
  assert.ok(
    cardMatches.length > 0,
    `${sectionLabel} listing should expose resource cards with favorite metadata`
  );
  assert.ok(
    cardMatches.some(([, inner]) =>
      /data-favorite-root/.test(inner) && /data-favorite-button/.test(inner)
    ),
    `${sectionLabel} cards should include favorite toggle markup`
  );
}

test('drawer navigation exposes primary sections', () => {
  const navRegex =
    /<a href="([^"]+)"[^>]*data-drawer-link[^>]*>\s*(?:<span[^>]*class="drawer-nav__icon"[^>]*>.*?<\/span>\s*)?<span[^>]*>([^<]+)<\/span>\s*<\/a>/gs;
  const navMatches = Array.from(homeHtml.matchAll(navRegex));
  const navItems = navMatches.map(([, href, label]) => [href, label.trim()]);
  assert.deepStrictEqual(navItems, [
    ['/', 'Home'],
    ['/exercises', 'Exercises'],
    ['/forms', 'Forms'],
    ['/warmups', 'Warmups'],
    ['/tools', 'Tools'],
  ]);
});

test('home page sets theme color meta', () => {
  const themeMeta = homeHtml.match(
    /<meta name="theme-color" content="([^"]+)"([^>]*)>/
  );
  assert.ok(themeMeta, 'theme-color meta tag is missing');
  assert.strictEqual(themeMeta[1], '#050b19');
  if (themeMeta[2]) {
    assert.match(
      themeMeta[2],
      /data-theme-color-light="#ecfeff"/,
      'light theme color data attribute missing'
    );
  }
});

test('home page features category previews', () => {
  const categoryRegex =
    /<a[^>]*class="[^"]*category-card[^"]*"[^>]*href="([^"]+)"[^>]*>.*?<h2[^>]*>([^<]+)<\/h2>.*?<p[^>]*class="[^"]*category-card__blurb[^"]*"[^>]*>([^<]+)<\/p>.*?<p[^>]*class="[^"]*category-card__preview[^"]*"[^>]*>([^<]+)<\/p>/gs;
  const categories = Array.from(homeHtml.matchAll(categoryRegex)).map(([, href, label, blurb, preview]) => ({
    href,
    label: label.trim(),
    blurb: blurb.trim(),
    preview: preview.trim(),
  }));
  assert.strictEqual(categories.length, 4);
  assert.deepStrictEqual(
    categories.map((category) => category.label),
    ['Exercises', 'Forms', 'Warmups', 'Tools']
  );
  const toolsCategory = categories.find((category) => category.label === 'Tools');
  assert.ok(toolsCategory, 'Tools category card is missing');
  assert.ok(
    toolsCategory.preview.includes('Timer'),
    'Tools preview should highlight available timers'
  );
});

test('tools listing surfaces all published utilities', () => {
  const cardRegex =
    /<a href="\/tools\/([^"]+)"[^>]*class="[^"]*tool-card[^"]*"[^>]*>.*?<h2[^>]*>([^<]+)<\/h2>.*?<p[^>]*class="[^"]*resource-card__summary[^"]*"[^>]*>([^<]+)<\/p>/gs;
  const toolCards = Array.from(toolsHtml.matchAll(cardRegex)).map(([, slug, label, description]) => ({
    slug,
    label: label.replace(/\s+/g, ' ').trim(),
    description: description.trim(),
  }));
  assert.strictEqual(toolCards.length, 5, 'expected five tool cards');
  const expectedNames = new Map([
    ['lesson-plans', 'Lesson Planner'],
    ['gauss-timer', 'Gauss Timer'],
    ['jam-groupaliser', 'Jam Groupaliser'],
    ['suggestions', 'Suggestion Generator'],
    ['timer', 'Timer'],
  ]);
  for (const card of toolCards) {
    const expected = expectedNames.get(card.slug);
    assert.ok(expected, `unexpected tool slug ${card.slug}`);
    assert.ok(card.label.includes(expected), `label for ${card.slug} should include "${expected}"`);
    assert.ok(card.description.length > 0, `tool ${card.slug} should have a description`);
  }
});

test('exercises list exposes filters and dataset metadata', () => {
  assert.ok(exercisesHtml.includes('id="filterDrawerToggle"'), 'filter toggle button missing');
  assertFavoritesIntegration(exercisesHtml, 'Exercises');
  const inlineModules = Array.from(
    exercisesHtml.matchAll(
      /<script type="module" src="data:video\/mp2t;base64,([^\"]+)"/g
    )
  );
  const hasFilterBootstrap = inlineModules.some(([, encoded]) => {
    try {
      const code = Buffer.from(encoded, 'base64').toString('utf8');
      return code.includes('setupResourceListFiltering(');
    } catch (error) {
      return false;
    }
  });
  assert.ok(hasFilterBootstrap, 'exercises page should inline resource filter bootstrap script');
  const nameOptions = ['Character Circle', 'Word at a Time Story'];
  for (const option of nameOptions) {
    assert.ok(
      exercisesHtml.includes(`value="${option}"`),
      `expected exercise option ${option}`
    );
  }
  const yesLetsTokens = [
    'value="Yes, Let&#39;s!"',
    'value="Yes, Let&apos;s!"',
    'value="Yes, Let\'s!"',
  ];
  assert.ok(
    yesLetsTokens.some((token) => exercisesHtml.includes(token)),
    'expected "Yes, Let\'s!" option in filters'
  );
  assert.ok(
    exercisesHtml.includes('value="Character, Energy, Group Play"'),
    'focus filters should include combined focus tags'
  );
  assert.ok(
    exercisesHtml.includes('value="4"'),
    'minimum people filter should include numeric options'
  );
  const listCount = (exercisesHtml.match(/class="resource-card"/g) || []).length;
  assert.strictEqual(
    listCount,
    expectedExerciseCount,
    `expected ${expectedExerciseCount} exercises in the listing`
  );
  assert.ok(
    exercisesHtml.includes('data-focus="Character, Energy, Group Play"'),
    'exercise cards should expose focus metadata'
  );
});

test(
  'warmups listing exposes favorite controls when available',
  { skip: !warmupsHtml },
  () => {
    assert.ok(warmupsHtml.includes('id="filterDrawerToggle"'), 'filter toggle button missing on warmups');
    assertFavoritesIntegration(warmupsHtml, 'Warmups');
  }
);

test(
  'forms listing exposes favorite controls when available',
  { skip: !formsHtml },
  () => {
    assert.ok(formsHtml.includes('id="filterDrawerToggle"'), 'filter toggle button missing on forms');
    assertFavoritesIntegration(formsHtml, 'Forms');
  }
);
