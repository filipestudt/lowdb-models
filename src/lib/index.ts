export function toObject(name: any, value: any) {
	let obj = {}
	obj[name] = value
	return obj
}

export function objectAsArray(obj: any): Array<ObjectKeyValue> {
	let arr: Array<ObjectKeyValue> = []
	for (let key in obj)
		arr.push({
			name: key, 
			value: obj[key]
		})
	return arr
}

export type ObjectKeyValue = {
	name: any
	value: any
}
