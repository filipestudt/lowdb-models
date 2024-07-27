import { toObject, objectAsArray, ObjectKeyValue } from './lib'

export type AttributeInfo = {
	required?: Boolean
	unique?: Boolean
}

// The model creator set the attribute's name as an own property
// to make it easier to loop into
export type Attribute = AttributeInfo & {
	name: any
}

// Model's attributes, each attribute it's an AttributeInfo type
// this way when the user is creating a new model it will show the AttributeInfo options
export type Attributes = {
	[k: string]: AttributeInfo
}

// To not have to depend on the lowdb package
export type Low = {
	data: any
	read: Function
	write: Function
}

export class Model<T> {
	tableName: string
	db: Low
	attributes: Array<Attribute>

	constructor(database: Low, tableName: string, attributes: Array<Attribute>) {
		this.db = database
		this.tableName = tableName
		this.attributes = attributes
	}

	async create(obj: T): Promise<void> {
		this.checkDuplicated(obj)
		this.checkRequired(obj)
		this.getData().push(obj)
		this.db.write()
	}

	async findAll(): Promise<Array<T> | null> {
		return this.getData()
	}		

	async findOne(query: any): Promise<T | null> {
		return this.getData().find(entry => {
			let entryArr = objectAsArray(entry)
			let queryArr = objectAsArray(query)
			return this.runQuery(queryArr, entryArr)
		})
	}

	async find(query: any): Promise<Array<T>> {
		return this.getData().filter(entry => {
			let entryArr = objectAsArray(entry)
			let queryArr = objectAsArray(query)
			return this.runQuery(queryArr, entryArr)
		})
	}

	async update(query: Object, value: Object): Promise<void> {		
		(await this.find(query)).map((entry: any) => {
			let entryArr = objectAsArray(entry)
			let valueArr = objectAsArray(value)

			for (let property of entryArr) {
				for (let val of valueArr) {
					if (property.name === val.name && val.value) {
						entry[val.name] = val.value
					}
				}
			}
		})
		this.db.write()
	}

	private runQuery(queries: Array<ObjectKeyValue>, entries: Array<ObjectKeyValue>): Boolean {		
		// Filter wich queries are met
		let queriesMet = queries.filter(query => {
			// Loop the entry to query
			// If the result length is one, then the query were met
			let matched = entries.filter(entry => 
				query.name === entry.name 
					&& query.value === entry.value)
				
			return matched.length === 1
		})
		// If all queries were met the length will be the same
		return queriesMet.length === queries.length
	}

	// Get the data of the attribute with the name of the model tableName	
	private getData(): Array<any> {
		if (!this.db.data) this.db.data = {}

		// Loop into data to check if it has the tableName attribute
		for (let key in this.db.data) 
			if (key === this.tableName) return this.db.data[key]		
		
		// If not found, create it
		type DataKey = keyof typeof data
		
		// Table name is a key of data
		// And it's value is the table name
		let tableName: DataKey = this.tableName
		
		// Use the tableName as a PropertyKey
		let attr: PropertyKey = tableName
		
		// Create an attribute inside data, wich name is the value of tableName
		// and set it's value as an empty array
		let data = this.db.data
		this.db.data = Object.defineProperty(data, attr, {value: []})	
		this.db.write()
		return this.db.data[attr]
	}

	private async checkDuplicated(obj: T): Promise<void> {
		for (let attr of this.attributes)
			if (attr.unique
				&& attr.unique === true
				&& await this.findOne(toObject(attr.name, obj[attr.name])))
				throw new Error('Duplicated')
	}

	private async checkRequired(obj: T): Promise<void> {
		for (let attr of this.attributes)
			if (attr.required
				&& attr.required === true
				&& !obj[attr.name])
				throw new Error('Required')
	}
}
