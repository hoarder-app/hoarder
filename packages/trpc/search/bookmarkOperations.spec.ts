import { expect, test } from 'vitest'
import { arrayToMap, mergeMapsIntersection, mergeMapsUnion } from "./bookmarkOperations";
import { BookmarkSearchInfo } from "./parsedExpression";

test('arrayToMap', () => {
    const bookmarks: BookmarkSearchInfo[] = [
        { id: '1', ranking: 1 },
        { id: '2', ranking: 2 },
        { id: '3' }
    ]
    const map = arrayToMap(bookmarks)
    expect(map.size).toBe(3)
    expect(map.get('1')).toEqual({ id: '1', ranking: 1 })
    expect(map.get('2')).toEqual({ id: '2', ranking: 2 })
    expect(map.get('3')).toEqual({ id: '3' })
})

test('mergeMapsIntersection', () => {
    const map1 = new Map<string, BookmarkSearchInfo>([
        ['1', { id: '1', ranking: 1 }],
        ['2', { id: '2', ranking: 2 }],
        ['3', { id: '3' }]
    ])
    const map2 = new Map<string, BookmarkSearchInfo>([
        ['2', { id: '2' }],
        ['3', { id: '3', ranking: 3 }],
        ['4', { id: '4', ranking: 4 }]
    ])
    const resultMap = mergeMapsIntersection(map1, map2)
    expect(resultMap.size).toBe(2)
    expect(resultMap.get('2')).toEqual({ id: '2', ranking: 2 })
    expect(resultMap.get('3')).toEqual({ id: '3', ranking: 3 })
})

test('mergeMapsUnion', () => {
    const map1 = new Map<string, BookmarkSearchInfo>([
        ['1', { id: '1', ranking: 1 }],
        ['2', { id: '2', ranking: 2 }],
        ['3', { id: '3' }]
    ])
    const map2 = new Map<string, BookmarkSearchInfo>([
        ['2', { id: '2' }],
        ['3', { id: '3', ranking: 3 }],
        ['4', { id: '4', ranking: 4 }]
    ])
    const resultMap = mergeMapsUnion(map1, map2)
    expect(resultMap.size).toBe(4)
    expect(resultMap.get('1')).toEqual({ id: '1', ranking: 1 })
    expect(resultMap.get('2')).toEqual({ id: '2', ranking: 2 })
    expect(resultMap.get('3')).toEqual({ id: '3', ranking: 3 })
    expect(resultMap.get('4')).toEqual({ id: '4', ranking: 4 })
})
