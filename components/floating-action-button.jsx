import { TouchableOpacity } from 'react-native'

const FloatingActionButton = ({ onPress, icon }) => {
    return (
        <TouchableOpacity onPress={onPress} className="absolute bottom-4 right-4 bg-blue-500 p-4 rounded-full z-50">
            {icon}
        </TouchableOpacity>
    )
}

export default FloatingActionButton