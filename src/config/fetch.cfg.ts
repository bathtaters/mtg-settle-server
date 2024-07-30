import { gql, HttpOptions, TypedDocumentNode } from '@apollo/client/core'
import { Card as GQLCard, Set as GQLSet, Query } from "mtggraphql"
import { TestRules } from "../utils/common.utils";
import { Card } from "../models/_types";
// @ts-ignore // resolveJsonModule is true in tsconfig
import { gqlKey } from "./credentials.json";
import { name, version } from "../../package.json"

export const cardImageURI = ({ scryfallId = '' }: Partial<Card>) => scryfallId && 
  `https://api.scryfall.com/cards/${scryfallId}?format=image&version=art_crop`,

setInfoURI = (setCode: Card['setCode']) => `https://api.scryfall.com/sets/${setCode}`,
setSymbolKey = 'icon_svg_uri',

scryfallHeaders = {
  'User-Agent': `bathtaters-${name}/${version}`,
  'Accept': 'application/json;q=0.9,*/*;q=0.8',
},

ignoreCards: TestRules<GQLCard>[] = [{
  test: 'some',
  equals: { // Card[Key] === Value
    isTextless: true,
    isPromo: true,
    isOversized: true,
    isOnlineOnly: true,
    isFullArt: true,
    isAlternative: true,
    isFoil: true,
  },
  matches: { // Value.test(Card[Key])
    // type: /Basic Land/,
    // number: /[^\d]/,
  }
}],
ignoreSets: TestRules<GQLSet>[] = [{
  test: 'some',
  equals: {
    isForeignOnly: true,
    isOnlineOnly: true,
    isPartialPreview: true,
    isFoilOnly: true,
  },
}],

gqlOptions: HttpOptions = {
  uri: 'https://graphql.mtgjson.com/',
  headers: { Authorization: gqlKey },
},

cardQuery: TypedDocumentNode<Query> = gql`
  query Cards($setCode: String!) {
    sets(
      input: { code: $setCode },
      page: { take: 1, skip: 0 },
      order: { order: ASC }
    ) {
      cards {
        uuid setCode name artist
        identifiers{scryfallId}
        type number isReprint
        isTextless isPromo isOversized
        isOnlineOnly isFullArt
        isAlternative isFoil
      }
    }
  }
`,

setQuery: TypedDocumentNode<Query> = gql`
  query Sets($take: Int, $skip: Int) {
    sets(
      input: { type: "expansion" },
      page: { take: $take, skip: $skip },
      order: { order: ASC }
    )
    {
      code name type block releaseDate
      isOnlineOnly isForeignOnly
      isPartialPreview isFoilOnly
    }
  }
`