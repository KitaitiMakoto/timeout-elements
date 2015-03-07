module Sprockets
  class ES6 < Tilt::Template
    def initialize_engine
    end

    def prepare
    end

    def evaluate(context, locals, &block)
      @output ||= Babel::Transpiler.transform(data)['code']
    end
  end
  ::Tilt.register ES6, 'es6'

  register_engine '.es6', ES6
end
