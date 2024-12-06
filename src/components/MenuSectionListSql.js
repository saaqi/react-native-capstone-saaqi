import {
  View,
  SectionList,
  Image,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native'
import * as SQLite from 'expo-sqlite'
import React, { useState, useEffect, useContext } from 'react'
import { GlobalContext } from '../GlobalState'
import Ionicons from '@expo/vector-icons/Ionicons'

const MenuSectionListSql = () => {
  const [isLoading, setLoading] = useState(true)
  const [menuItems, setMenuItems] = useState([])
  const [inputQuery, setInputQuery] = useState('')

  const {
    searchQuery, setSearchQuery
  } = useContext(GlobalContext)

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setSearchQuery(inputQuery)
    }, 300)

    return () => {
      clearTimeout(debounceTimeout)
    }
  }, [inputQuery])

  const dbName = 'little_lemon'

  const initDatabase = async () => {
    const db = await SQLite.openDatabaseAsync(dbName)
    // Create table if not exists
    try {
      await db.execAsync(
        `PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS menu (
          id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          name text NOT NULL,
          price real NOT NULL,
          description text NOT NULL,
          image text NOT NULL,
          category text NOT NULL
        );`
      )
    } catch (error) {
      console.error('Creating table:', error)
    }
  }

  useEffect(() => {
    initDatabase()
  }, [])

  // Fetch menu data from remote server
  const fetchMenuFromServer = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json'
      )
      const data = await response.json()
      return data.menu.map((item, index) => {
        return {
          ...item,
          id: `menu-${index + 1}`
        }
      })
    } catch (error) {
      console.error('Error fetching menu:', error)
      return []
    }
  }

  // Insert menu items into SQLite database
  const insertMenuItems = async (items) => {
    try {
      const db = await SQLite.openDatabaseAsync(dbName)
      // const result = await db.runAsync(
      //   'INSERT INTO menu (name, price, description, image, category) VALUES (?, ?, ?, ?, ?)', ['aaa', 100]);
      // const entryData = items.map(item =>
      //   `("${item.name}", ${item.price}, "${item.description}", "${item.image}", "${item.category}")`
      // ).join(', ')
      // await db.runAsync(
      //   `INSERT INTO menu (name, price, description, image, category) VALUES ` +
      //   `${entryData};`
      // )
      const entryData = items.map(() => '(?, ?, ?, ?, ?)').join(', ')
      const values = items.flatMap(item => [
        item.name,
        item.price,
        item.description,
        item.image,
        item.category,
      ])

      await db.runAsync(
        `INSERT INTO menu (name, price, description, image, category) VALUES ${entryData};`,
        values
      )
    } catch (error) {
      console.error('Inserting menu items:', error)
    }
  }

  // Retrieve menu items from database
  const retrieveMenuItems = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(dbName)
      const allRows = await db.getAllAsync('SELECT * FROM menu')
      // Map each row to an object with the desired structure
      return allRows.map(row => ({
        name: row.name,
        price: parseFloat(row.price),
        description: row.description,
        image: row.image,
        category: row.category
      }))
    } catch (error) {
      console.error('Retrieving menu items:', error)
      return []
    }
  }

  // Check if database is empty
  const isDatabaseEmpty = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(dbName)
      const allRows = await db.getAllAsync('SELECT COUNT(*) as count FROM menu')
      // If the count is 0, it means the table is empty
      return allRows[0].count === 0
    } catch (error) {
      console.error('Checking database:', error)
      return false // Return false if there's an error (indicating the table is not empty)
    }
  }

  // Main data loading logic
  const loadMenuData = async () => {
    try {
      const isEmpty = await isDatabaseEmpty()
      if (isEmpty) {
        // Fetch from server and store in database
        const serverMenuItems = await fetchMenuFromServer()
        await insertMenuItems(serverMenuItems)
        setMenuItems(serverMenuItems)
      } else {
        // Load from database
        const storedMenuItems = await retrieveMenuItems()
        setMenuItems(storedMenuItems)
      }
    } catch (error) {
      console.error('Setting Menu List:', error)
    } finally {
      setLoading(false)
    }
  }

  // Effect to load menu data on component mount
  useEffect(() => {
    loadMenuData()
  }, [])

  const menuFooter = () => <Text style={styles.menuFooter}>All Rights Reserved &copy; 2024</Text>
  const Separator = () => <View style={styles.separator}></View>
  const Foods = ({ name, price, description, image }) => {
    return (
      <View style={{
        flex: 1,
        padding: 20,
        flexDirection: 'row',
        gap: 10
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{name}</Text>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>{description}</Text>
          <Text style={{ fontSize: 18, fontWeight: 500, marginTop: 'auto' }}>{price}</Text>
        </View>
        <View style={{}}>
          <Image
            source={{ uri: `https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images/${image}?raw=true` }}
            style={{
              height: 150,
              width: 150,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#31511e',
              alignSelf: 'flex-end'
            }}
            resizeMode={'cover'}
            accessible={true}
            accessibilityLabel={name}
          />
        </View>
      </View>
    )
  }
  const sections = [
    {
      title: "Starters",
      data: menuItems.filter((item) => item.category === "starters"),
    },
    {
      title: "Mains",
      data: menuItems.filter((item) => item.category === "mains"),
    },
    {
      title: "Desserts",
      data: menuItems.filter((item) => item.category === "desserts"),
    },
  ]
  const filteredSectionMenu = sections.map((section) => {
    const filteredData = section.data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    if (filteredData.length > 0) {
      return { ...section, data: filteredData }
    }

    return null
  }).filter(Boolean)
  const MenuHeader = () => {
    return (
      <View style={styles.container}>
        <View style={styles.heroSection}>
          <Text style={styles.headingText}>Little Lemon</Text>
          <Text style={styles.subHeadingText}>Chicago</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.heroBodyText, { flex: .5 }]}>
              We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
            </Text>
            <View style={{ borderRadius: 20, flex: .5 }}>
              <Image
                source={require('../../assets/hero.png')}
                style={{
                  alignSelf: 'flex-end',
                  height: 200,
                  width: 132,
                  borderRadius: 10,

                }}
                resizeMode={'cover'}
                accessible={true}
                accessibilityLabel={"Hero Section Image"}
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.listContainer}>
      {isLoading ? (<ActivityIndicator style={{ flex: 1 }} />) : (
        <SectionList
          keyboardDismissMode={'on-drag'}
          sections={filteredSectionMenu}
          keyExtractor={(item, index) => item.name + index}
          renderItem={({ item }) => (
            <Foods
              name={item.name}
              description={item.description}
              price={'$' + item.price}
              image={item.image}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>
              {title}
            </Text>
          )}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            <View>
              <MenuHeader />
              <KeyboardAvoidingView
                style={styles.searchOuterContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                <View style={styles.searchContainer}>
                  <Ionicons style={styles.icon} name="search-circle-outline" />
                  <TextInput
                    style={styles.inputField}
                    onChangeText={setInputQuery}
                    placeholder='Search for dishes'
                    secureTextEntry={false}
                    keyboardType='default'
                    value={inputQuery}
                  />
                </View>
              </KeyboardAvoidingView>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                marginVertical: 20,
                paddingHorizontal: 20,
                marginTop: 20,
                gap: 10
              }}>
                <Pressable
                  style={[styles.menuSelector, searchQuery === '' && { backgroundColor: '#31511E' }]}
                  onPress={() => setSearchQuery('')}
                >
                  <Text
                    style={[
                      searchQuery === '' && { color: '#F6FCDF' },
                      { textAlign: 'center', fontWeight: 500, fontFamily: 'Karla Medium' }
                    ]}
                  >
                    All
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.menuSelector, searchQuery === 'starters' && { backgroundColor: '#31511E' }]}
                  onPress={() => setSearchQuery('starters')}
                >
                  <Text
                    style={[
                      searchQuery === 'starters' && { color: '#F6FCDF' },
                      { textAlign: 'center', fontWeight: 500, fontFamily: 'Karla Medium' }
                    ]}
                  >
                    Starters
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.menuSelector, searchQuery === 'mains' && { backgroundColor: '#31511E' }]}
                  onPress={() => setSearchQuery('mains')}
                >
                  <Text
                    style={[
                      searchQuery === 'mains' && { color: '#F6FCDF' },
                      { textAlign: 'center', fontWeight: 500, fontFamily: 'Karla Medium' }
                    ]}
                  >
                    Mains
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.menuSelector, searchQuery === 'desserts' && { backgroundColor: '#31511E' }]}
                  onPress={() => setSearchQuery('desserts')}
                >
                  <Text
                    style={[
                      searchQuery === 'desserts' && { color: '#F6FCDF' },
                      { textAlign: 'center', fontWeight: 500, fontFamily: 'Karla Medium' }
                    ]}
                  >
                    Desserts
                  </Text>
                </Pressable>
              </View>
            </View>
          }
          ListFooterComponent={menuFooter}
        />
      )}
    </View>
  )
}

//Style Sheet
const styles = StyleSheet.create({

  listContainer: {
    flex: 1,
  },

  sectionHeader: {
    fontWeight: 500,
    fontFamily: 'Markazi Text Medium',
    fontSize: 20,
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomColor: '#31511E',
    borderBottomWidth: 1,
  },

  menuSelector: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderColor: '#333',
    borderWidth: 1,
    fontFamily: 'Markazi Text Regular',
    flex: .25,
    borderRadius: 40
  },

  menuFooter: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    marginTop: 10,
  },

  separator: {
    borderBottomWidth: 1,
    borderColor: '#31511E',
    borderStyle: 'dashed'
  },

  heroSection: {
    backgroundColor: "#31511E",
    paddingVertical: 30,
    paddingHorizontal: 20
  },

  headingText: {
    fontSize: 60,
    fontFamily: "Markazi Text Medium",
    fontWeight: 500,
    color: "#ffff00",
    marginBottom: 20
  },

  subHeadingText: {
    fontSize: 36,
    fontFamily: "Karla Medium",
    fontWeight: 500,
    color: "#E1E9C8",
    marginBottom: 40
  },

  heroBodyText: {
    fontSize: 20,
    color: "#F6FCDF",
    fontFamiy: "Karla"
  },

  searchOuterContainer: {
    backgroundColor: "#31511E",
    paddingHorizontal: 10,
    paddingBottom: 30
  },

  searchContainer: {
    backgroundColor: "#fff",
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  icon: {
    fontSize: 24,
    borderRightWidth: 1,
    marginRight: 10,
    paddingRight: 10
  },

  inputField: {
    fontSize: 18,
    fontFamily: 'Markazi Text Regular',
    outlineStyle: 'none',
    height: '100%',
    width: "100%",
  },

})

export default MenuSectionListSql