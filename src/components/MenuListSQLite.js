import {
  Text,
  StyleSheet,
  FlatList,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
  // ScrollView,
  // Pressable
} from 'react-native'
import { useEffect, useState } from 'react'
import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseAsync('little_lemon')

const MenuListSQLite = () => {

  const [isLoading, setLoading] = useState(true)
  const [menuList, setMenuList] = useState([])

  const windowWidth = Dimensions.get('window').width


  // Initialize database and check for existing data
  useEffect(() => {
    const initializeDatabase = async () => {
      // Create the 'menu' table if it doesn't exist
      await db.execAsync(
        [
          {
            sql: `
              CREATE TABLE IF NOT EXISTS menu (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT NOT NULL,
                image TEXT NOT NULL,
                category TEXT NOT NULL
              )
            `,
            args: [],
          },
        ],
        false
      );

      // Check if data already exists in the 'menu' table
      const result = await db.execAsync(
        [
          {
            sql: "SELECT * FROM menu",
            args: [],
          },
        ],
        true
      );

      if (result[0].rows.length > 0) {
        // Load existing data from the database
        setMenuList(result[0].rows);
        setLoading(false);
      } else {
        // Fetch data from remote server and insert into database
        fetchmenuList();
      }
    };

    initializeDatabase();
  }, []);

  // Fetch menu data from the remote server and store it in the database
  const fetchmenuList = async () => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json"
      );
      const json = await response.json();
      const menuItems = json.menu;

      // Insert menu data into the database
      const insertQueries = menuItems.map((item) => ({
        sql: `
          INSERT INTO menu (name, price, description, image, category)
          VALUES (?, ?, ?, ?)
        `,
        args: [item.name, item.price, item.description, item.image, item.category],
      }));

      await db.execAsync(insertQueries, false);

      // Set the fetched data as state
      setMenuList(menuItems);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching menu data:", error);
    }
  }

  const menuHeader = () => <Text style={styles.menuHeader}>Our Menu</Text>
  const menuFooter = () => <Text style={styles.menuFooter}>All Rights Reserved 2024</Text>
  const Separator = () => <View style={styles.separator}></View>


  const Foods = ({ name, price, description, image }) => {
    return (
      <View style={{
        flex: 1,
        paddingVertical: 20,
        flexDirection: 'row',
        gap: 10
      }}>
        <View style={{ width: windowWidth - 200 }}>
          <Text style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{name} </Text>
          <Text style={{ fontSize: 18 }}>{description}</Text>
          <Text style={{ fontSize: 20, fontWeight: 500, marginTop: 'auto' }}>{price}</Text>
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

  return (
    <View style={styles.listContainer}>
      {isLoading ? (<ActivityIndicator />) : (
        <View>
          {/* <FlatList
            data={menuList}
            keyExtractor={(item, index) => item + index + 'cats'}
            renderItem={({ item }) => (
              <FoodCats
                category={item.category}
              />
            )}
          /> */}
          <FlatList
            data={menuList}
            keyExtractor={(item, index) => item + index}
            renderItem={({ item }) => (
              <Foods
                name={item.name}
                description={item.description}
                price={'$' + item.price}
                image={item.image}
              />
            )}
            ItemSeparatorComponent={Separator}
            ListHeaderComponent={menuHeader}
            ListFooterComponent={menuFooter}
          />
        </View>
      )}
    </View>
  )
}

export default MenuListSQLite

//Style Sheet
const styles = StyleSheet.create({

  listContainer: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 20
  },

  menuHeader: {
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center'
  },

  menuFooter: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    marginTop: 10,
  },

  separator: {
    borderBottomWidth: 1,
    borderColor: '#666',
    paddingTop: 1
  }

})