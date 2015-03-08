class EmbedScript < Middleman::Extension
  def initialize(app, options_hash={}, &block)
    super
    @html_dir = Pathname("#{app.root}/#{app.build_dir}/#{app.html_dir}")
  end

  def after_build
    Pathname.glob("#{@html_dir}/**/*").each do |path|
      source = path.read
      # This fails for tags like <script src="including space">
      # and commented out tags
      # but currently doesn't parse strictly.
      next unless source.match /<script([^>]*)>/im
      src = nil
      script_embedded = source.gsub(/<script([^>]*)>/im) {|matched|
        attrs = $1.split(/\s+/).map {|comp|
          if comp.downcase.start_with? 'src'
            src = comp.split('=', 2)[1]
            if src.start_with? '"'
              src.gsub! /(\A"|"\z)/, ''
            elsif src.start_with? "'"
              src.gsub! /(\A'|'\z)/, ''
            end
            nil
          else
            comp
          end
        }
        break unless src
        # TODO: Consider absolute URI and absolute path
        # TODO: Percent decoding
        "<script #{attrs.join(' ')}>#{@html_dir.join(src).read}"
      }
      next unless src
      path.write script_embedded
    end
  end
end

::Middleman::Extensions.register :embed_script, EmbedScript
