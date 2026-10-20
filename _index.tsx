import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Experience, type ExperienceProduct} from '~/components/Experience';
import experienceStyles from '~/styles/experience.css?url';
import lenisStyles from 'lenis/dist/lenis.css?url';

export const meta: Route.MetaFunction = () => [
  {title: 'Creative Journey'},
];

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: lenisStyles},
  {rel: 'stylesheet', href: experienceStyles},
];

export async function loader({context}: Route.LoaderArgs) {
  const {products} = await context.storefront.query(HOME_PRODUCTS_QUERY);
  const items: ExperienceProduct[] = products.nodes.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    price: `${Number(p.priceRange.minVariantPrice.amount).toFixed(2)} ${p.priceRange.minVariantPrice.currencyCode}`,
  }));
  return {products: items};
}

export default function Homepage() {
  const {products} = useLoaderData<typeof loader>();
  return <Experience products={products} />;
}

const HOME_PRODUCTS_QUERY = `#graphql
  query HomeProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 9, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
