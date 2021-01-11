const PubSub = () => {
  let state = {};

  const publish = async (evtName, data) => {
    console.log('published: ', evtName, data);
    const promises = (state[evtName] || []).map(cb => {
      return Promise.resolve(cb(data));
    });
    try {
      const v = await Promise.all(promises);
      return v[0];
    } catch {
      console.log("User promise failed");
    }
  };

  const subscribe = (evtName, callback) => {
    state[evtName] = state[evtName] || [];
    state[evtName].push(callback);

    return () => {
      state[evtName] = state[evtName].filter(c => c !== callback);
    };
  };

  return {
    publish,
    subscribe,
    clear: () => {state = {}}
  };
};

export default PubSub;
