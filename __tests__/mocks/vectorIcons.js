const React = require('react');
const { Text } = require('react-native');

const createIconComponent = () => {
  return function MockIcon(props) {
    return React.createElement(Text, { testID: props.testID, accessibilityLabel: props.accessibilityLabel }, props.name || '');
  };
};

module.exports = {
  Ionicons: createIconComponent(),
  MaterialIcons: createIconComponent(),
  FontAwesome: createIconComponent(),
  createIconSet: () => createIconComponent(),
};
