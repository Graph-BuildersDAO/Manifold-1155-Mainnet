# Subgraph: Manifold (Arweave File Data Sources Example)

created by Graph BuildersDAO - https://www.buildersdao.tech/

## Utilizing Arweave File Data Sources to retreive Manifold 1155 metadata.

This projected was requested for the BuildersDAO to take on and showcase a subgraph to index information stored on Arweave.
This subgraph specifically listens to one sample 1155 contract.

The following are the events handled:

- Handle Transfer Batch
- Handle Transfer Single
- Hande URI

## SAMPLE QUERY 1:

```graphql
query GetAccountHoldings(
  $account: ID = "0x00430ed74173cb5e61cb3d7e25b35a9790d8c4d4"
) {
  account(id: $account) {
    id
    holding(first: 5) {
      balance
      nft {
        metadata {
          artist
          createdBy
          description
          image
          name
          collection
        }
      }
    }
  }
}
```

## SAMPLE QUERY 2:

```graphql
{
  nfts(first: 5) {
    id
    creator
    timestamp
    totalSupply
    metadata {
      content
    }
  }
}
```
