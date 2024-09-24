import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as storage from '@utils/AppStorage';
import * as database from '@utils/AppSqliteDb';
import Icon from 'react-native-vector-icons/AntDesign';

const gridValue = 130;

const MapCustom = () => {
  const [grid, setGrid] = useState({});
  const [memorialData, setMemorialData] = useState({
    graveNumber: '',
  });
  const [loading, setLoading] = useState(true);

  const xScrollViewRef = useRef<ScrollView>(null);
  const yScrollViewRef = useRef<ScrollView>(null);

  const fetchData = async () => {
    const graveNumber = await storage.get('graveNumber');
    setMemorialData(prevMemorial => ({...prevMemorial, graveNumber}));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getGridData = async () => {
    const sectionId = await storage.get('currentSectionId');
    const memorialId = await storage.get('memorialId');

    const [records, jd] = await Promise.all([
      database.getRecords(
        'Jobs',
        "sectionId = ? and LOWER(statusName) IN('booked', 'completed', 'complete pass', 'complete fail', 'no memorial present', 'unable to locate plot') ",
        [sectionId],
        'ORDER BY id DESC',
        'statusName, sectionId, familyName, graveNumber, direction, column, memorialId',
      ),
      database.getRecords('Jobs', 'memorialId = ?', [memorialId]),
    ]);

    const designatedColumn = jd[0]['column'];
    let gridRecords = {};
    let totalRecords = 0;
    let rowCount = 0;
    let counter = 0;

    records.forEach((obj, index) => {
      const column = obj['column'];
      const statusName = obj.statusName.toLowerCase();

      gridRecords[column] = gridRecords[column] || [];

      const gridColor =
        statusName === 'complete pass'
          ? '#148f14'
          : statusName === 'complete fail'
          ? '#ad1212'
          : '#eaeaea';

      if (designatedColumn === column) {
        if (parseInt(obj.memorialId) === parseInt(memorialId)) {
          rowCount = counter;
        }
        counter++;
      }

      gridRecords[column].push([
        obj.familyName,
        obj.graveNumber,
        gridColor,
        obj.direction,
      ]);
      totalRecords++;
    });

    return {gridRecords, designatedColumn, rowCount};
  };

  useEffect(() => {
    (async () => {
      const {gridRecords, designatedColumn, rowCount} = await getGridData();
      setGrid(gridRecords);
      setLoading(false);

      const xPosition =
        designatedColumn > 2 ? (designatedColumn - 2) * gridValue : 0;
      const yPosition = rowCount > 2 ? (rowCount - 2) * gridValue : 0;

      xScrollViewRef.current?.scrollTo({x: xPosition, animated: true});
      yScrollViewRef.current?.scrollTo({y: yPosition, animated: true});
    })();
  }, []);

  const renderGrid = useMemo(() => {
    return Object.keys(grid).map((row, rowIndex) => (
      <View key={rowIndex}>
        {grid[row].map((colData, colIndex) => (
          <View
            style={[
              styles.gridColumn,
              {
                backgroundColor: colData[2],
                alignItems: 'center',
                justifyContent: 'center',
              },
              memorialData.graveNumber === colData[1] && {
                borderColor: 'black',
                borderWidth: 3,
              },
            ]}
            key={colIndex}>
            <Icon
              name={'arrow' + colData[3]}
              size={20}
              color="#000"
              style={styles.icon}
            />
            <Text style={styles.gridTitle}>{colData[0]}</Text>
            <Text style={styles.gridGraveNumber}>{colData[1]}</Text>
          </View>
        ))}
      </View>
    ));
  }, [grid, memorialData]);

  if (loading) {
    return (
      <View>
        <ActivityIndicator
          size={68}
          style={styles.loadingIndicator}
          color="#ad1212"></ActivityIndicator>
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.rowContainer}>
      <ScrollView
        ref={xScrollViewRef}
        horizontal={true}
        style={styles.gridBoxes}>
        <ScrollView
          ref={yScrollViewRef}
          style={styles.innerScrollView}
          nestedScrollEnabled={true}>
          <View style={styles.gridContainer}>{renderGrid}</View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gridColumn: {
    width: 110,
    height: 110,
    margin: 10,
    backgroundColor: '#eaeaea',
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
    padding: 5,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Centers the entire grid horizontally
    paddingHorizontal: 10,
    paddingVertical: 20,
  },

  gridBoxes: {
    width: '100%',
    marginTop: 30,
    backgroundColor: '#dadada',
  },

  gridGraveNumber: {
    color: 'black',
  },

  gridTitle: {
    color: 'black',
    fontSize: 15,
    textAlign: 'center',
  },
  rowContainer: {
    marginBottom: 10,
    flex: 1,
  },
  innerScrollView: {
    width: '100%',
    height: 700,
  },
  loadingIndicator: {
    marginTop: 50,
    justifyContent: 'center',
    flex: 1,
    alignContent: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ad1212',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default MapCustom;
