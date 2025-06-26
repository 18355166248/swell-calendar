import postcssPrefixer from 'postcss-prefixer';

export default {
  plugins: [
    postcssPrefixer({
      prefix: 'swell-calendar-',
    }),
  ],
};
