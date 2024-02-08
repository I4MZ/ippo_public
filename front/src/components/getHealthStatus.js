// getHealthStatus.js
import axios from 'axios';

export const getHealthStatus = async () => {
    try {
        const response = await axios({
            method: "get",
            url: "/health",
        });
        console.log('Health Status:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching health status:', error);
    }
};
