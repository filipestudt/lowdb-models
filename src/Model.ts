import { toObject, objectAsArray, ObjectKeyValue } from './lib/index.js'

export type AttributeInfo = {
	required?: Boolean
	unique?: Boolean
	generate?: Function
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

export function newModel(attributes: Attributes, info: {tableName: string}): Model<any> {	
	let attributesArr: Array<any> = []
	for (let key in attributes) {
		attributesArr.push({name: key,...attributes[key]})
	}
	return new Model(info.tableName, attributesArr)
}

class Model<T> {
	tableName: string
	db: Low
	attributes: Array<Attribute>

	constructor(tableName: string, attributes: Array<Attribute>) {
		this.tableName = tableName
		this.attributes = attributes
	}

	init(database: Low) {
		this.db = database
	}

	async create(obj: T): Promise<void> {
		this.generate(obj)
		await this.checkDuplicated(obj)
		this.checkRequired(obj)

		// Only write attributes declared on the model
		let objToWrite = {}
		for (let key of Object.keys(obj))				
			for (let attr of this.attributes)
				if (attr.name === key) objToWrite[key] = obj[key]

		this.getData().push(objToWrite)
		this.db.write()
	}

	async findAll(): Promise<Array<T> | null> {
		return this.getData()
	}		

	async findOne(query: any): Promise<T | null> {
		return this.getData().find(entry => {			
			return this.runQuery(query, entry)
		})
	}

	async find(query: any): Promise<Array<T>> {
		return this.getData().filter(entry => {
			return this.runQuery(query, entry)
		})
	}

	async update(query: Object, obj: Object): Promise<void> {
		(await this.find(query)).map((entry: any) => {
			for (let key of Object.keys(obj))				
				for (let attr of this.attributes)
					if (attr.name === key) entry[key] = obj[key]
		})
		this.db.write()
	}	

	async remove(query: Object): Promise<void> {
		// Filter the data saving only the results that did not match the query
		let newData = this.getData().filter(entry => {
			// If matched the query return false
			return !this.runQuery(query, entry)
		})

		this.write(newData)
	}

	private runQuery(query: Object, entry: Object): Boolean {
		let queries = objectAsArray(query)
		let entries = objectAsArray(entry)
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
		// Use the tableName as a PropertyKey
		let tableName: PropertyKey = this.getTableNameAsPropertyKey()
		
		// Create an attribute inside data, wich name is the value of tableName
		// and set it's value as an empty array
		this.write([])
		
		return this.db.data[tableName]
	}

	private getTableNameAsPropertyKey(): PropertyKey {
		type DataKey = keyof typeof this.db.data
		
		// Table name is a key of data
		// And it's value is the table name
		let tableName: DataKey = this.tableName
		
		return tableName
	}

	private async write(value: Array<Object>): Promise<void> {
		// Use the tableName as a PropertyKey
		let tableName: PropertyKey = this.getTableNameAsPropertyKey()
		
		let data = this.db.data || {}
		data[tableName] = value
		this.db.data = data
		this.db.write()
	}

	private async checkDuplicated(obj: T): Promise<void> {
		for (let attr of this.attributes)
			if (attr.unique
				&& attr.unique === true
				&& await this.findOne(toObject(attr.name, obj[attr.name])))
				throw new Error('Duplicated')
	}

	private checkRequired(obj: T): void {
		for (let attr of this.attributes)
			if (attr.required
				&& attr.required === true
				&& !obj[attr.name])
				throw new Error('Required')
	}

	private generate(obj: T): void {
		for (let attr of this.attributes)
			for (let key in obj)
				if (key === attr.name && attr.generate) obj[attr.name] = attr.generate()
	}
}
