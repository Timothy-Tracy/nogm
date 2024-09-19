import QueryBuilder from '../src/querybuilder/QueryBuilder';

describe('QueryBuilder', () => {
  let builder: QueryBuilder;

  beforeEach(() => {
    builder = new QueryBuilder();
  });

  test('should build a simple MATCH query', () => {
    const query = builder
      .match('(n:Node)')
      .return('n')
      .build();
    expect(query).toBe('MATCH (n:Node)\nRETURN n');
  });

  test('should build a query with WHERE clause', () => {
    const query = builder
      .match('(p:Person)')
      .where('p.age > 18')
      .return('p')
      .build();
    expect(query).toBe('MATCH (p:Person)\nWHERE p.age > 18\nRETURN p');
  });

  test('should build a query with multiple WHERE clauses', () => {
    const query = builder
      .match('(p:Person)')
      .where('p.age > 18')
      .andWhere('p.name = "John"')
      .return('p')
      .build();
    expect(query).toBe('MATCH (p:Person)\nWHERE p.age > 18\nAND p.name = "John"\nRETURN p');
  });

  test('should build a query with OR WHERE clause', () => {
    const query = builder
      .match('(p:Person)')
      .where('p.age > 18')
      .orWhere('p.name = "John"')
      .return('p')
      .build();
    expect(query).toBe('MATCH (p:Person)\nWHERE p.age > 18\nOR p.name = "John"\nRETURN p');
  });

  test('should build a query with ORDER BY clause', () => {
    const query = builder
      .match('(p:Person)')
      .return('p')
      .orderBy('p.age DESC')
      .build();
    expect(query).toBe('MATCH (p:Person)\nRETURN p\nORDER BY p.age DESC');
  });

  test('should build a query with SKIP and LIMIT', () => {
    const query = builder
      .match('(p:Person)')
      .return('p')
      .skip(10)
      .limit(5)
      .build();
    expect(query).toBe('MATCH (p:Person)\nRETURN p\nSKIP 10\nLIMIT 5');
  });

  test('should build a query with WITH clause', () => {
    const query = builder
      .match('(p:Person)')
      .with('p, p.age AS age')
      .return('p, age')
      .build();
    expect(query).toBe('MATCH (p:Person)\nWITH p, p.age AS age\nRETURN p, age');
  });

  test('should handle parameters', () => {
    builder
      .match('(p:Person)')
      .where('p.age > $minAge')
      .setParameter('minAge', 18)
      .return('p');
    
    expect(builder.build()).toBe('MATCH (p:Person)\nWHERE p.age > $minAge\nRETURN p');
    expect(builder.getParameters()).toEqual({ minAge: 18 });
  });

  test('should clear the query builder', () => {
    builder
      .match('(p:Person)')
      .where('p.age > 18')
      .return('p');
    
    builder.clear();

    expect(builder.build()).toBe('');
    expect(builder.getParameters()).toEqual({});
  });

  test('should build a query with OPTIONAL MATCH', () => {
    const query = builder
      .match('(p:Person)')
      .optionalMatch('(p)-[:OWNS]->(c:Car)')
      .return('p, c')
      .build();
    expect(query).toBe('MATCH (p:Person)\nOPTIONAL MATCH (p)-[:OWNS]->(c:Car)\nRETURN p, c');
  });

  test('should build a query with subquery', () => {
    const query = builder
      .match('(p:Person)')
      .where('p.age > 18')
      .subquery((subBuilder) => {
        subBuilder
          .match('(p)-[:OWNS]->(c:Car)')
          .return('count(c) AS carCount');
      })
      .return('p, carCount')
      .build();
    expect(query).toBe('MATCH (p:Person)\nWHERE p.age > 18\n((p)-[:OWNS]->(c:Car)\nRETURN count(c) AS carCount)\nRETURN p, carCount');
  });

  test('should build a query with UNION', () => {
    const otherBuilder = new QueryBuilder()
      .match('(c:Car)')
      .return('c.brand AS item');

    const query = builder
      .match('(p:Person)')
      .return('p.name AS item')
      .union(otherBuilder)
      .build();
    expect(query).toBe('MATCH (p:Person)\nRETURN p.name AS item\nUNION\nMATCH (c:Car)\nRETURN c.brand AS item');
  });

  test('should build a query with UNION ALL', () => {
    const otherBuilder = new QueryBuilder()
      .match('(c:Car)')
      .return('c.brand AS item');

    const query = builder
      .match('(p:Person)')
      .return('p.name AS item')
      .unionAll(otherBuilder)
      .build();
    expect(query).toBe('MATCH (p:Person)\nRETURN p.name AS item\nUNION ALL\nMATCH (c:Car)\nRETURN c.brand AS item');
  });

  test('should handle complex queries', () => {
    const query = builder
      .match('(p:Person)')
      .where('p.age > $minAge')
      .andWhere('p.name STARTS WITH $namePrefix')
      .with('p')
      .optionalMatch('(p)-[:OWNS]->(c:Car)')
      .return('p, collect(c) AS cars')
      .orderBy('p.age DESC')
      .skip(10)
      .limit(5)
      .setParameter('minAge', 18)
      .setParameter('namePrefix', 'J')
      .build();

    expect(query).toBe(
      'MATCH (p:Person)\n' +
      'WHERE p.age > $minAge\n' +
      'AND p.name STARTS WITH $namePrefix\n' +
      'WITH p\n' +
      'OPTIONAL MATCH (p)-[:OWNS]->(c:Car)\n' +
      'RETURN p, collect(c) AS cars\n' +
      'ORDER BY p.age DESC\n' +
      'SKIP 10\n' +
      'LIMIT 5'
    );

    expect(builder.getParameters()).toEqual({ minAge: 18, namePrefix: 'J' });
  });
});