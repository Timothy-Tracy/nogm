/**
 * QueryBuilder class for constructing Cypher queries.
 * 
 * This class provides a fluent interface for building complex Cypher queries
 * in a type-safe manner. It supports various clauses including MATCH, WHERE,
 * WITH, RETURN, ORDER BY, SKIP, and LIMIT.
 * 
 * @example
 * const query = new QueryBuilder()
 *   .match('(p:Person)')
 *   .where('p.age > $age')
 *   .andWhere('p.name = $name')
 *   .return('p')
 *   .orderBy('p.age DESC')
 *   .limit(10)
 *   .build();
 */
class QueryBuilder {
    private matchClauses: string[] = [];
    private whereClauses: string[] = [];
    private withClauses: string[] = [];
    private returnClause: string = '';
    private orderByClause: string = '';
    private skipValue: number | null = null;
    private limitValue: number | null = null;
    private parameters: Record<string, any> = {};
  
    /**
     * Adds a MATCH clause to the query.
     * @param pattern - The pattern to match.
     * @returns The QueryBuilder instance for chaining.
     */
    match(pattern: string): this {
      this.matchClauses.push(`MATCH ${pattern}`);
      return this;
    }
  
    /**
     * Adds an OPTIONAL MATCH clause to the query.
     * @param pattern - The pattern to optionally match.
     * @returns The QueryBuilder instance for chaining.
     */
    optionalMatch(pattern: string): this {
      this.matchClauses.push(`OPTIONAL MATCH ${pattern}`);
      return this;
    }
  
    /**
     * Adds a WHERE clause to the query.
     * @param condition - The condition for the WHERE clause.
     * @returns The QueryBuilder instance for chaining.
     */
    where(condition: string): this {
      this.whereClauses.push(`WHERE ${condition}`);
      return this;
    }
  
    /**
     * Adds an AND condition to the existing WHERE clause.
     * @param condition - The condition to add with AND.
     * @returns The QueryBuilder instance for chaining.
     */
    andWhere(condition: string): this {
      if (this.whereClauses.length === 0) {
        return this.where(condition);
      }
      this.whereClauses.push(`AND ${condition}`);
      return this;
    }
  
    /**
     * Adds an OR condition to the existing WHERE clause.
     * @param condition - The condition to add with OR.
     * @returns The QueryBuilder instance for chaining.
     */
    orWhere(condition: string): this {
      if (this.whereClauses.length === 0) {
        return this.where(condition);
      }
      this.whereClauses.push(`OR ${condition}`);
      return this;
    }
  
    /**
     * Adds a WITH clause to the query.
     * @param expression - The expression for the WITH clause.
     * @returns The QueryBuilder instance for chaining.
     */
    with(expression: string): this {
      this.withClauses.push(`WITH ${expression}`);
      return this;
    }
  
    /**
     * Sets the RETURN clause of the query.
     * @param expression - The expression to return.
     * @returns The QueryBuilder instance for chaining.
     */
    return(expression: string): this {
      this.returnClause = `RETURN ${expression}`;
      return this;
    }
  
    /**
     * Sets the ORDER BY clause of the query.
     * @param expression - The expression to order by.
     * @returns The QueryBuilder instance for chaining.
     */
    orderBy(expression: string): this {
      this.orderByClause = `ORDER BY ${expression}`;
      return this;
    }
  
    /**
     * Sets the SKIP clause of the query.
     * @param count - The number of records to skip.
     * @returns The QueryBuilder instance for chaining.
     */
    skip(count: number): this {
      this.skipValue = count;
      return this;
    }
  
    /**
     * Sets the LIMIT clause of the query.
     * @param count - The maximum number of records to return.
     * @returns The QueryBuilder instance for chaining.
     */
    limit(count: number): this {
      this.limitValue = count;
      return this;
    }
  
    /**
     * Adds a parameter to the query.
     * @param name - The name of the parameter.
     * @param value - The value of the parameter.
     * @returns The QueryBuilder instance for chaining.
     */
    setParameter(name: string, value: any): this {
      this.parameters[name] = value;
      return this;
    }
  
    /**
     * Builds and returns the final Cypher query string.
     * @returns The constructed Cypher query string.
     */
    build(): string {
      const parts: string[] = [
        ...this.matchClauses,
        ...this.whereClauses,
        ...this.withClauses,
        this.returnClause,
        this.orderByClause,
      ];
  
      if (this.skipValue !== null) {
        parts.push(`SKIP ${this.skipValue}`);
      }
  
      if (this.limitValue !== null) {
        parts.push(`LIMIT ${this.limitValue}`);
      }
  
      return parts.filter(Boolean).join('\n');
    }
  
    /**
     * Returns the parameters set for this query.
     * @returns An object containing the query parameters.
     */
    getParameters(): Record<string, any> {
      return { ...this.parameters };
    }
  
    /**
     * Clears all clauses and parameters from the QueryBuilder.
     * @returns The QueryBuilder instance for chaining.
     */
    clear(): this {
      this.matchClauses = [];
      this.whereClauses = [];
      this.withClauses = [];
      this.returnClause = '';
      this.orderByClause = '';
      this.skipValue = null;
      this.limitValue = null;
      this.parameters = {};
      return this;
    }
  
    /**
     * Creates a subquery using a callback function.
     * @param callback - A function that receives a new QueryBuilder instance.
     * @returns The QueryBuilder instance for chaining.
     */
    subquery(callback: (subBuilder: QueryBuilder) => void): this {
      const subBuilder = new QueryBuilder();
      callback(subBuilder);
      const subquery = subBuilder.build();
      this.matchClauses.push(`(${subquery})`);
      Object.assign(this.parameters, subBuilder.getParameters());
      return this;
    }
  
    /**
     * Adds a UNION clause to the query.
     * @param otherQuery - Another QueryBuilder instance to union with.
     * @returns The QueryBuilder instance for chaining.
     */
    union(otherQuery: QueryBuilder): this {
      const currentQuery = this.build();
      const unionQuery = otherQuery.build();
      this.clear();
      this.matchClauses.push(`${currentQuery}\nUNION\n${unionQuery}`);
      Object.assign(this.parameters, otherQuery.getParameters());
      return this;
    }
  
    /**
     * Adds a UNION ALL clause to the query.
     * @param otherQuery - Another QueryBuilder instance to union all with.
     * @returns The QueryBuilder instance for chaining.
     */
    unionAll(otherQuery: QueryBuilder): this {
      const currentQuery = this.build();
      const unionQuery = otherQuery.build();
      this.clear();
      this.matchClauses.push(`${currentQuery}\nUNION ALL\n${unionQuery}`);
      Object.assign(this.parameters, otherQuery.getParameters());
      return this;
    }
  }
  
  export default QueryBuilder;