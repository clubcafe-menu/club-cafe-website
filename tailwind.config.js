const CLUB_CAFE_COLORS = {
    burgundy: {
        50: '#fdf2f4',
        100: '#fbe5e8',
        500: '#8c1c2b',
        700: '#5a0f1b',
        800: '#4a0e17',
        900: '#33080e',
    },
    cream: {
        50: '#fffdfa',
        100: '#fceee3',
        200: '#f8dcc8',
    },
    amber: {
        400: '#fbbf24',
        500: '#f59e0b',
    }
};

tailwind.config = {
    theme: {
        extend: {
            colors: CLUB_CAFE_COLORS,
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
            }
        }
    }
}
